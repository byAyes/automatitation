#!/usr/bin/env bash
# =============================================================================
# SeaHorse — Runner automatizado (Linux / macOS)
# Ejecuta el pipeline de scraping + matching + email, o inicia el dashboard.
# Valida .env, detecta CVs en data/, y pregunta antes de enviar.
#
# Uso:
#   ./scripts/run.sh
#   ./scripts/run.sh --cv ~/Downloads/CV.pdf
#   ./scripts/run.sh --dashboard
#   ./scripts/run.sh --basic
# =============================================================================
set -euo pipefail

# ─── Argumentos ──────────────────────────────────────────────────────────────
CV_PATH=""
MODE=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --cv)   CV_PATH="$2"; shift 2 ;;
        --dashboard) MODE="dashboard"; shift ;;
        --basic)     MODE="basic"; shift ;;
        --help|-h)
            echo "Uso: $0 [--cv RUTA] [--dashboard] [--basic]"
            echo "  --cv RUTA      Ruta al archivo CV/PDF"
            echo "  --dashboard    Inicia servidor de desarrollo Next.js"
            echo "  --basic        Ejecuta pipeline básico (sin extracción de CV)"
            exit 0 ;;
        *) echo "❌ Argumento desconocido: $1"; exit 1 ;;
    esac
done

# ─── Colors ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
GRAY='\033[2;37m'
NC='\033[0m'

step()   { echo -e "\n━━━ $1 ━━━"; }
ok()     { echo -e "  ${GREEN}✓${NC} $1"; }
warn()   { echo -e "  ${YELLOW}⚠${NC} $1"; }
fail()   { echo -e "  ${RED}✗${NC} $1"; }
info()   { echo -e "    ${GRAY}$1${NC}"; }

# ─── Helper: read non-commented env var from .env ────────────────────────────
# Returns empty string if var is missing, commented, or has placeholder value.
get_env_var() {
    local name="$1"
    local line value
    while IFS= read -r line; do
        # Trim whitespace
        line="${line#"${line%%[![:space:]]*}"}"
        line="${line%"${line##*[![:space:]]}"}"
        # Skip comments and empty lines
        [[ "$line" =~ ^# ]] && continue
        [[ -z "$line" ]] && continue
        # Match KEY=value
        if [[ "$line" =~ ^"$name"=(.+) ]]; then
            value="${BASH_REMATCH[1]}"
            # Skip template placeholders
            if [[ "$value" =~ your_.*_here|your_email ]]; then
                echo ""
                return 0
            fi
            echo "$value"
            return 0
        fi
    done < ".env" 2>/dev/null
    echo ""
}

# ─── 1. Prereqs check ───────────────────────────────────────────────────────
step "1/4  Verificando entorno"

if ! command -v node &>/dev/null; then
    fail "Node.js no encontrado. Ejecuta primero setup.sh"
    exit 1
fi
node_ver=$(node --version)
ok "Node.js $node_ver"

# Carpeta del proyecto
# Si el script está en scripts/, el project root es el padre.
# Si está suelto (descarga standalone), el project root es su mismo directorio.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_BASENAME="$(basename "$SCRIPT_DIR")"
if [[ "$SCRIPT_BASENAME" == "scripts" ]]; then
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
else
    PROJECT_ROOT="$SCRIPT_DIR"
fi
cd "$PROJECT_ROOT"
ok "Directorio: $PROJECT_ROOT"

# ─── 2. Validar .env ────────────────────────────────────────────────────────
step "2/4  Validando configuración (.env)"

if [[ ! -f ".env" ]]; then
    fail ".env no encontrado. Ejecuta setup.sh primero."
    exit 1
fi
ok ".env existe"

# Cargar variables mínimas
MISSING_VARS=()

[[ -z "$(get_env_var "JSEARCH_API_KEY")" ]] && MISSING_VARS+=("JSEARCH_API_KEY")
[[ -z "$(get_env_var "GEMINI_API_KEY")" ]] && MISSING_VARS+=("GEMINI_API_KEY")
[[ -z "$(get_env_var "GMAIL_RECIPIENT")" ]] && MISSING_VARS+=("GMAIL_RECIPIENT")

if [[ ${#MISSING_VARS[@]} -gt 0 ]]; then
    warn "Variables pendientes: ${MISSING_VARS[*]}"
    echo "    Edita .env y completa los valores faltantes."
    echo "    Luego vuelve a ejecutar este script."
    echo ""
    read -rp "    ¿Abrir .env ahora? (s/n): " EDIT_NOW
    if [[ "$EDIT_NOW" == "s" ]]; then
        if command -v nano &>/dev/null; then
            nano ".env"
        elif command -v vim &>/dev/null; then
            vim ".env"
        elif command -v code &>/dev/null; then
            code ".env"
        else
            echo "    Abre .env con tu editor favorito."
        fi
    fi
    exit 1
else
    ok "Variables esenciales configuradas"
fi

# ─── 3. Elegir modo de ejecución ────────────────────────────────────────────
step "3/4  Seleccionando modo"

if [[ "$MODE" == "dashboard" ]]; then
    ok "Modo Dashboard seleccionado"
elif [[ "$MODE" == "basic" ]]; then
    ok "Modo Pipeline Básico seleccionado"
    info "Se ejecutará: scrape → match → email (sin perfil extraído de CV)"
else
    # Buscar CVs automáticamente
    CANDIDATES=()
    if [[ -d "data" ]]; then
        while IFS= read -r -d '' f; do
            CANDIDATES+=("$f")
        done < <(find "data" -maxdepth 1 -name "*.pdf" -print0 2>/dev/null || true)
    fi

    echo ""
    echo "    ¿Qué quieres hacer?"
    echo ""
    echo "    [1] Pipeline completo (extraer perfil desde CV → scrape → match → email)"
    echo "    [2] Pipeline básico  (scrape → match → email, sin extracción de CV)"
    echo "    [3] Dashboard UI     (servidor de desarrollo Next.js)"
    echo "    [4] Solo Jina Reader (test headless Chrome fallback)"
    echo ""
    read -rp "    Elige [1-4]: " MODE_CHOICE

    if [[ "$MODE_CHOICE" == "4" ]]; then
        # Jina Reader standalone
        read -rp "    Fuente (linkedin/indeed/computrabajo/glassdoor): " JR_SOURCE
        JR_SOURCE="${JR_SOURCE:-linkedin}"
        read -rp "    Query (ej: software engineer): " JR_QUERY
        JR_QUERY="${JR_QUERY:-software engineer}"
        read -rp "    Máx jobs (ej: 10): " JR_MAX
        JR_MAX="${JR_MAX:-10}"

        step "4/4  Ejecutando Jina Reader standalone"

        JINA_URL="$(get_env_var "JINA_READER_BASE_URL")"
        JINA_URL="${JINA_URL:-https://r.jina.ai}"
        export JINA_READER_BASE_URL="$JINA_URL"
        info "JINA_READER_BASE_URL=$JINA_URL"
        info "Comando: npx tsx src/scrapers/strategies/jinaReader.ts $JR_SOURCE \"$JR_QUERY\" $JR_MAX"
        echo ""

        if ! npx tsx src/scrapers/strategies/jinaReader.ts "$JR_SOURCE" "$JR_QUERY" "$JR_MAX" 2>&1; then
            fail "Jina Reader falló"
        fi

        exit 0
    fi

    if [[ "$MODE_CHOICE" == "2" ]]; then
        MODE="basic"
    elif [[ "$MODE_CHOICE" == "3" ]]; then
        MODE="dashboard"
    else
        # Pipeline completo — buscar CV
        if [[ -z "$CV_PATH" && ${#CANDIDATES[@]} -gt 0 ]]; then
            echo ""
            echo "    CVs encontrados en data/:"
            echo ""
            for i in "${!CANDIDATES[@]}"; do
                echo "    [$((i+1))] $(basename "${CANDIDATES[$i]}")"
            done
            echo "    [$(( ${#CANDIDATES[@]} + 1 ))] Especificar otra ruta"
            echo "    [$(( ${#CANDIDATES[@]} + 2 ))] Cancelar"
            echo ""
            read -rp "    Elige [1-$(( ${#CANDIDATES[@]} + 2 ))]: " CV_CHOICE

            if [[ "$CV_CHOICE" -le "${#CANDIDATES[@]}" ]]; then
                CV_PATH="${CANDIDATES[$((CV_CHOICE-1))]}"
            elif [[ "$CV_CHOICE" -eq "$(( ${#CANDIDATES[@]} + 1 ))" ]]; then
                read -rp "    Ruta del CV: " CV_PATH
            else
                echo "    Cancelado."
                exit 0
            fi
        elif [[ -z "$CV_PATH" ]]; then
            read -rp "    Ruta del CV/PDF (o Enter para cancelar): " CV_PATH
            if [[ -z "$CV_PATH" ]]; then
                echo "    Cancelado."
                exit 0
            fi
        fi
    fi
fi

# ─── 4. Ejecutar ────────────────────────────────────────────────────────────
if [[ "$MODE" == "dashboard" ]]; then
    step "4/4  Iniciando servidor de desarrollo Next.js"
    info "    Dashboard: http://localhost:3000"
    info "    Healthcheck: http://localhost:3000/api/health"
    info "    Presiona Ctrl+C para detener"
    echo ""
    if ! npm run dev 2>&1; then
        fail "npm run dev falló"
    fi
elif [[ "$MODE" == "basic" ]]; then
    step "4/4  Ejecutando pipeline básico (scrape → match → email)"
    echo ""
    if ! npm run automate 2>&1; then
        fail "Pipeline básico falló"
    fi
else
    step "4/4  Ejecutando pipeline completo"
    info "    CV: $CV_PATH"
    info "    Esto toma ~60-90 segundos..."
    echo ""
    if ! npx tsx scripts/run-profile-pipeline.ts "$CV_PATH" 2>&1; then
        fail "Pipeline completo falló"
    fi
fi
