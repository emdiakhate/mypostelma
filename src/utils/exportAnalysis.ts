/**
 * Export Analysis Utilities
 * 
 * Functions to export competitor analysis to PDF and Excel formats
 */

import type { Competitor } from '@/types/competitor';
import type { CompetitorAnalysis } from '@/services/competitorAnalytics';

/**
 * Export analysis to PDF
 */
export function exportToPDF(competitor: Competitor, analysis: CompetitorAnalysis | null) {
  // Create a printable HTML version
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Analyse - ${competitor.name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #333;
          }
          h1 {
            color: #2563eb;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10px;
          }
          h2 {
            color: #1e40af;
            margin-top: 30px;
            border-left: 4px solid #2563eb;
            padding-left: 10px;
          }
          .section {
            margin: 20px 0;
          }
          .list-item {
            margin: 8px 0;
            padding-left: 20px;
          }
          .list-item:before {
            content: "•";
            color: #2563eb;
            font-weight: bold;
            display: inline-block;
            width: 1em;
            margin-left: -1em;
          }
          .meta {
            color: #666;
            font-size: 14px;
            margin: 10px 0;
          }
          .cost {
            background: #f0f9ff;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
          }
          @media print {
            body { margin: 20px; }
          }
        </style>
      </head>
      <body>
        <h1>Analyse Concurrentielle - ${competitor.name}</h1>
        
        <div class="meta">
          <strong>Secteur:</strong> ${competitor.industry || 'N/A'}<br>
          <strong>Date d'analyse:</strong> ${analysis?.analyzed_at ? new Date(analysis.analyzed_at).toLocaleDateString('fr-FR') : 'Non analysé'}<br>
          ${analysis?.analysis_cost ? `<strong>Coût de l'analyse:</strong> $${analysis.analysis_cost.toFixed(2)}` : ''}
        </div>

        ${competitor.description ? `
          <div class="section">
            <h2>Description</h2>
            <p>${competitor.description}</p>
          </div>
        ` : ''}

        ${analysis?.summary ? `
          <div class="section">
            <h2>Résumé</h2>
            <p>${analysis.summary}</p>
          </div>
        ` : ''}

        ${analysis?.positioning ? `
          <div class="section">
            <h2>Positionnement sur le marché</h2>
            <p>${analysis.positioning}</p>
          </div>
        ` : ''}

        ${analysis?.content_strategy ? `
          <div class="section">
            <h2>Stratégie de contenu</h2>
            <p>${analysis.content_strategy}</p>
          </div>
        ` : ''}

        ${analysis?.tone ? `
          <div class="section">
            <h2>Ton de communication</h2>
            <p>${analysis.tone}</p>
          </div>
        ` : ''}

        ${analysis?.strengths && analysis.strengths.length > 0 ? `
          <div class="section">
            <h2>Forces</h2>
            ${analysis.strengths.map(item => `<div class="list-item">${item}</div>`).join('')}
          </div>
        ` : ''}

        ${analysis?.weaknesses && analysis.weaknesses.length > 0 ? `
          <div class="section">
            <h2>Faiblesses</h2>
            ${analysis.weaknesses.map(item => `<div class="list-item">${item}</div>`).join('')}
          </div>
        ` : ''}

        ${analysis?.opportunities_for_us && analysis.opportunities_for_us.length > 0 ? `
          <div class="section">
            <h2>Opportunités stratégiques pour nous</h2>
            ${analysis.opportunities_for_us.map(item => `<div class="list-item">${item}</div>`).join('')}
          </div>
        ` : ''}

        ${analysis?.social_media_presence ? `
          <div class="section">
            <h2>Présence sur les réseaux sociaux</h2>
            <p>${analysis.social_media_presence}</p>
          </div>
        ` : ''}

        ${analysis?.recommendations ? `
          <div class="section">
            <h2>Recommandations</h2>
            <p>${analysis.recommendations}</p>
          </div>
        ` : ''}

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Export analysis to Excel (CSV format)
 */
export function exportToExcel(competitor: Competitor, analysis: CompetitorAnalysis | null) {
  const rows = [
    ['Analyse Concurrentielle - ' + competitor.name],
    [''],
    ['Information de base'],
    ['Nom', competitor.name],
    ['Secteur', competitor.industry || 'N/A'],
    ['Date d\'ajout', new Date(competitor.added_at).toLocaleDateString('fr-FR')],
    ['Dernière analyse', competitor.last_analyzed_at ? new Date(competitor.last_analyzed_at).toLocaleDateString('fr-FR') : 'Non analysé'],
    ['Nombre d\'analyses', competitor.analysis_count.toString()],
    [''],
    ['Réseaux sociaux'],
    ['Instagram', competitor.instagram_url || 'N/A'],
    ['Facebook', competitor.facebook_url || 'N/A'],
    ['LinkedIn', competitor.linkedin_url || 'N/A'],
    ['Twitter', competitor.twitter_url || 'N/A'],
    ['TikTok', competitor.tiktok_url || 'N/A'],
    ['Site web', competitor.website_url || 'N/A'],
    [''],
  ];

  if (analysis) {
    rows.push(
      ['Analyse'],
      ['Date d\'analyse', new Date(analysis.analyzed_at).toLocaleDateString('fr-FR')],
      ['Coût', analysis.analysis_cost ? `$${analysis.analysis_cost.toFixed(2)}` : 'N/A'],
      [''],
      ['Résumé', analysis.summary || 'N/A'],
      ['Positionnement', analysis.positioning || 'N/A'],
      ['Stratégie de contenu', analysis.content_strategy || 'N/A'],
      ['Ton', analysis.tone || 'N/A'],
      ['Présence sociale', analysis.social_media_presence || 'N/A'],
      [''],
      ['Forces']
    );

    if (analysis.strengths && analysis.strengths.length > 0) {
      analysis.strengths.forEach(item => rows.push(['', item]));
    }

    rows.push([''], ['Faiblesses']);
    if (analysis.weaknesses && analysis.weaknesses.length > 0) {
      analysis.weaknesses.forEach(item => rows.push(['', item]));
    }

    rows.push([''], ['Opportunités']);
    if (analysis.opportunities_for_us && analysis.opportunities_for_us.length > 0) {
      analysis.opportunities_for_us.forEach(item => rows.push(['', item]));
    }

    rows.push([''], ['Recommandations', analysis.recommendations || 'N/A']);
  }

  // Convert to CSV
  const csv = rows.map(row => 
    row.map(cell => {
      // Escape quotes and wrap in quotes if contains comma or quote
      const escaped = cell.replace(/"/g, '""');
      return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') 
        ? `"${escaped}"` 
        : escaped;
    }).join(',')
  ).join('\n');

  // Add BOM for Excel UTF-8 support
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  
  // Download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `analyse-${competitor.name.replace(/[^a-z0-9]/gi, '-')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
