/**
 * Email template module — generates beautiful HTML emails with plain text fallback
 * for the weekly job digest.
 */

/**
 * Format a job digest email with both HTML and plain text versions.
 * @param jobs Array of jobs with match scores
 * @param date Date string for email header
 * @returns Object with `html` and `text` properties
 */
export function formatJobDigest(
  jobs: Array<{ job: { title: string; company: string; location?: string | null; description?: string | null; url: string; salary?: number | null }; score: number; matchedSkills: string[] }>,
  date: string = new Date().toISOString()
): { html: string; text: string } {
  const displayDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (!jobs || jobs.length === 0) {
    return {
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Job Digest</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);border-radius:16px 16px 0 0;padding:40px 30px;text-align:center;">
              <img src="https://img.icons8.com/fluency/96/briefcase.png" alt="" width="48" height="48" style="display:block;margin:0 auto 16px;" />
              <h1 style="color:#ffffff;font-size:28px;font-weight:700;margin:0 0 8px;">Weekly Job Digest</h1>
              <p style="color:#a0aec0;font-size:16px;margin:0;">${displayDate}</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;padding:40px 30px;">
              <h2 style="color:#1a202c;font-size:20px;font-weight:600;margin:0 0 8px;">No new jobs found</h2>
              <p style="color:#718096;font-size:16px;line-height:1.6;margin:0;">We didn't find any new job listings this week. Your search criteria may be too specific, or there may be fewer postings than usual. Check back next week!</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#1a202c;border-radius:0 0 16px 16px;padding:24px 30px;text-align:center;">
              <p style="color:#718096;font-size:13px;margin:0;">Seahorse — Automated Job Matching Pipeline</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      text: `Weekly Job Digest - ${date}\n\nNo new jobs found for this week.\n\nBest regards,\nJob Email Automation`,
    };
  }

  const sortedJobs = [...jobs].sort((a, b) => b.score - a.score);

  // Build job cards HTML
  let jobsHtml = '';
  const textLines: string[] = [
    `Weekly Job Digest - ${displayDate}`,
    '',
    `We found ${jobs.length} matching jobs for you this week:`,
    '',
  ];

  sortedJobs.forEach((jobItem, index) => {
    const { job, score, matchedSkills } = jobItem;
    const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
    const scoreLabel = score >= 80 ? 'Excellent Match' : score >= 60 ? 'Good Match' : 'Potential Match';
    const salaryStr = job.salary ? `$${job.salary.toLocaleString()}` : null;
    const locationStr = job.location || 'Remote';

    jobsHtml += `
          <tr>
            <td style="padding:8px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:14px;color:#64748b;padding-bottom:6px;">
                          ${jobItem.job.source ? `<span style="background:#e2e8f0;padding:2px 8px;border-radius:4px;font-size:12px;">${escapeHtml(jobItem.job.source)}</span>` : ''}
                          ${salaryStr ? `<span style="color:#10b981;font-weight:600;margin-left:8px;">${escapeHtml(salaryStr)}</span>` : ''}
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <h3 style="color:#1e293b;font-size:18px;font-weight:700;margin:0 0 4px;line-height:1.3;">
                            <a href="${escapeHtml(job.url)}" style="color:#2563eb;text-decoration:none;font-weight:700;">${escapeHtml(job.title)}</a>
                          </h3>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:12px;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-right:16px;color:#475569;font-size:14px;">
                                <span style="font-weight:600;">${escapeHtml(job.company)}</span>
                              </td>
                              <td style="color:#64748b;font-size:14px;">${escapeHtml(locationStr)}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ${matchedSkills.length > 0 ? `
                      <tr>
                        <td style="padding-bottom:14px;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              ${matchedSkills.slice(0, 5).map(skill => `
                                <td style="background:#dbeafe;color:#1d4ed8;font-size:12px;font-weight:500;padding:4px 10px;border-radius:20px;margin-right:6px;display:inline-block;">${escapeHtml(skill)}</td>
                              `).join('')}
                              ${matchedSkills.length > 5 ? `<td style="color:#64748b;font-size:12px;padding-left:4px;">+${matchedSkills.length - 5}</td>` : ''}
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ` : ''}
                      ${job.description ? `
                      <tr>
                        <td style="padding-bottom:14px;">
                          <p style="color:#64748b;font-size:14px;line-height:1.5;margin:0;">${escapeHtml(truncate(job.description, 200))}</p>
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td>
                                <a href="${escapeHtml(job.url)}" style="display:inline-block;background:#3b82f6;color:#ffffff;font-size:14px;font-weight:600;padding:10px 24px;border-radius:8px;text-decoration:none;">View Job →</a>
                              </td>
                              <td align="right">
                                <table cellpadding="0" cellspacing="0" style="background:${scoreColor}15;border-radius:8px;padding:6px 14px;display:inline-block;">
                                  <tr>
                                    <td style="color:${scoreColor};font-size:13px;font-weight:700;">${score}%</td>
                                  </tr>
                                  <tr>
                                    <td style="color:${scoreColor};font-size:11px;font-weight:500;opacity:0.8;">${scoreLabel}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;

    // Plain text version
    textLines.push(`${index + 1}. ${job.title} at ${job.company} - ${locationStr}`);
    textLines.push(`   ${job.url}`);
    textLines.push(`   Match: ${Math.round(score)}% | Skills: ${matchedSkills.join(', ')}`);
    textLines.push('');
  });

  textLines.push('---');
  textLines.push(`Sent by Seahorse — Automated Job Matching Pipeline`);

  const totalJobs = sortedJobs.length;
  const avgScore = Math.round(sortedJobs.reduce((sum, j) => sum + j.score, 0) / totalJobs);
  const topScore = Math.round(sortedJobs[0].score);

  return {
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Job Digest</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);border-radius:16px 16px 0 0;padding:40px 30px;text-align:center;">
              <img src="https://img.icons8.com/fluency/96/briefcase.png" alt="" width="48" height="48" style="display:block;margin:0 auto 16px;" />
              <h1 style="color:#ffffff;font-size:28px;font-weight:700;margin:0 0 8px;">Weekly Job Digest</h1>
              <p style="color:#a0aec0;font-size:16px;margin:0 0 20px;">${displayDate}</p>
              <span style="display:inline-block;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:20px;padding:8px 20px;">
                <span style="color:#ffffff;font-size:14px;font-weight:600;">${totalJobs} jobs · ${avgScore}% avg match · Best: ${topScore}%</span>
              </span>
            </td>
          </tr>

          <!-- Summary -->
          <tr>
            <td style="background-color:#ffffff;padding:30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" align="center" style="padding:0 8px;">
                    <div style="background:#ecfdf5;border-radius:12px;padding:16px;">
                      <div style="color:#10b981;font-size:24px;font-weight:700;">${totalJobs}</div>
                      <div style="color:#6b7280;font-size:13px;">Jobs Found</div>
                    </div>
                  </td>
                  <td width="33%" align="center" style="padding:0 8px;">
                    <div style="background:#eff6ff;border-radius:12px;padding:16px;">
                      <div style="color:#3b82f6;font-size:24px;font-weight:700;">${avgScore}%</div>
                      <div style="color:#6b7280;font-size:13px;">Avg Match</div>
                    </div>
                  </td>
                  <td width="33%" align="center" style="padding:0 8px;">
                    <div style="background:#fef3c7;border-radius:12px;padding:16px;">
                      <div style="color:#f59e0b;font-size:24px;font-weight:700;">${topScore}%</div>
                      <div style="color:#6b7280;font-size:13px;">Best Match</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="background-color:#ffffff;padding:0 30px;">
              <div style="height:1px;background:#e2e8f0;width:100%;"></div>
            </td>
          </tr>

          <!-- Jobs section header -->
          <tr>
            <td style="background-color:#ffffff;padding:24px 30px 8px;">
              <h2 style="color:#1e293b;font-size:18px;font-weight:700;margin:0;">Matched Jobs</h2>
              <p style="color:#64748b;font-size:14px;margin:4px 0 0;">Sorted by match score — highest first</p>
            </td>
          </tr>

          <!-- Job Cards -->
          ${jobsHtml}

          <!-- Spacer after jobs -->
          <tr>
            <td style="background-color:#ffffff;height:20px;"></td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:0 0 16px 16px;padding:32px 30px;text-align:center;">
              <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0 0 8px;">
                You're receiving this email because you subscribed to job alerts from Seahorse.
              </p>
              <p style="color:#475569;font-size:12px;margin:0;">
                Seahorse — Automated Job Matching Pipeline
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    text: textLines.join('\n'),
  };
}

/** Escape HTML special characters */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Truncate text to max length */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '…';
}
