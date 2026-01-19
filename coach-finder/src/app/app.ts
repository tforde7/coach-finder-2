import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleSearchService, type SearchResult } from './core/services/google-search.service';
import { SearchFormComponent } from './shared/components/search-form/search-form.component';
import { ResultsTableComponent } from './shared/components/results-table/results-table.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SearchFormComponent, ResultsTableComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private googleSearchService = inject(GoogleSearchService);

  readonly results = this.googleSearchService.results$;
  readonly loading = this.googleSearchService.loading$;
  readonly error = this.googleSearchService.error$;
  readonly searchQuery = this.googleSearchService.currentQuery$;
  readonly totalResults = this.googleSearchService.totalResults$;

  // Pagination signals from service
  readonly currentPage = this.googleSearchService.currentPage$;
  readonly pageSize = this.googleSearchService.pageSize$;
  readonly hasNext = this.googleSearchService.hasNextPage;
  readonly hasPrevious = this.googleSearchService.hasPreviousPage;

  readonly currentSearchParams = signal<{ coachTypes: string[]; countries: string[]; funnelTerms: string[]; leadMagnetTerms: string[]; incomeProxyTerms: string[]; exclusionTerms: string[]; resultsPerSearch: number }>({
    coachTypes: [],
    countries: [],
    funnelTerms: [],
    leadMagnetTerms: [],
    incomeProxyTerms: [],
    exclusionTerms: [],
    resultsPerSearch: 10,
  });

  onConfigUpdated(config: { apiKey: string; searchEngineId: string }): void {
    this.googleSearchService.setApiKey(config.apiKey);
    this.googleSearchService.setSearchEngineId(config.searchEngineId);
  }

  async onSearch(params: {
    apiKey: string;
    searchEngineId: string;
    coachTypes: string[];
    countries: string[];
    funnelTerms: string[];
    leadMagnetTerms: string[];
    incomeProxyTerms: string[];
    exclusionTerms: string[];
    resultsPerSearch: number;
  }): Promise<void> {
    this.currentSearchParams.set({ coachTypes: params.coachTypes, countries: params.countries, funnelTerms: params.funnelTerms, leadMagnetTerms: params.leadMagnetTerms, incomeProxyTerms: params.incomeProxyTerms, exclusionTerms: params.exclusionTerms, resultsPerSearch: params.resultsPerSearch });

    // Pass the total results the user requested; service enforces per-request limit (10) and API max (100)
    const maxResults = params.resultsPerSearch;
    await this.googleSearchService.search(
      params.coachTypes,
      params.countries,
      params.funnelTerms,
      params.leadMagnetTerms,
      params.incomeProxyTerms,
      params.exclusionTerms,
      1,
      params.resultsPerSearch,
      maxResults
    );
  }

  async onNextPage(): Promise<void> {
    const params = this.currentSearchParams();
    const next = this.currentPage() + 1;
    await this.googleSearchService.search(
      params.coachTypes,
      params.countries,
      params.funnelTerms,
      params.leadMagnetTerms,
      params.incomeProxyTerms,
      params.exclusionTerms,
      next,
      params.resultsPerSearch,
      params.resultsPerSearch
    );
  }

  async onPreviousPage(): Promise<void> {
    const params = this.currentSearchParams();
    const prev = Math.max(1, this.currentPage() - 1);
    await this.googleSearchService.search(
      params.coachTypes,
      params.countries,
      params.funnelTerms,
      params.leadMagnetTerms,
      params.incomeProxyTerms,
      params.exclusionTerms,
      prev,
      params.resultsPerSearch,
      params.resultsPerSearch
    );
  }

  onClear(): void {
    this.googleSearchService.clearResults();
  }

  onDownloadCsv(): void {
    const results = this.results();
    if (results.length === 0) {
      return;
    }

    const headers = [
      'Title',
      'LinkedIn URL',
      'Snippet',
      'location',
      'niche_guess',
      'funnel_signals',
      'leadmagnet_signals',
      'website_url',
      'calendar_or_apply_link',
      'recent_activity_signal',
      'confidence_score'
    ];

    const params = this.currentSearchParams();
    const toHaystack = (r: SearchResult) => `${r.title} ${r.snippet}`;

    const rows = results.map((r) => {
      const hay = toHaystack(r);
      const location = this.findFirstMatch(hay, params.countries);
      const niche = this.findFirstMatch(hay, params.coachTypes);
      const funnelSignals = this.findAllMatches(hay, params.funnelTerms).join('; ');
      const leadMagnetSignals = this.findAllMatches(hay, params.leadMagnetTerms).join('; ');
      const websiteUrl = ''; // not available from current data
      const calendarOrApply = (funnelSignals.split('; ').filter(Boolean).find(s => /book|apply|calendar|schedule|call|appointment/i.test(s))) ?? '';
      const recentActivity = ''; // not available from current data
      const confidenceScore = ''; // to be implemented next

      return [
        r.title,
        r.link,
        r.snippet,
        location,
        niche,
        funnelSignals,
        leadMagnetSignals,
        websiteUrl,
        calendarOrApply,
        recentActivity,
        confidenceScore
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => this.escapeCsvCell(cell)).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `coaches-${Date.now()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private escapeCsvCell(cell: string): string {
    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  }

  // ------- CSV helpers (mirror table heuristics) -------
  private normalize(text: string): string {
    return (text || '').toLowerCase();
  }

  private findFirstMatch(source: string, candidates: string[]): string {
    const s = this.normalize(source);
    const found = candidates.find((c) => s.includes(c.toLowerCase()));
    return found ?? '';
  }

  private findAllMatches(source: string, candidates: string[]): string[] {
    const s = this.normalize(source);
    return candidates.filter((c) => s.includes(c.toLowerCase()));
  }
}
