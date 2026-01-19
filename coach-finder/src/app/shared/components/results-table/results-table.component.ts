import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { SearchResult } from '../../../core/services/google-search.service';

@Component({
  selector: 'app-results-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results-table.component.html',
  styleUrl: './results-table.component.scss',
})
export class ResultsTableComponent {
  readonly results = input<SearchResult[]>([]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly searchQuery = input('');
  readonly totalResults = input(0);

  // Search context inputs for derived columns
  readonly coachTypes = input<string[]>([]);
  readonly countries = input<string[]>([]);
  readonly funnelTerms = input<string[]>([]);
  readonly leadMagnetTerms = input<string[]>([]);

  // Pagination inputs
  readonly currentPage = input(1);
  readonly pageSize = input(10);
  readonly hasNext = input(false);
  readonly hasPrevious = input(false);

  // Events
  readonly downloadCsv = output();
  readonly clear = output();
  readonly nextPage = output();
  readonly previousPage = output();

  get hasResults(): boolean {
    return this.results().length > 0;
  }

  get showLoading(): boolean {
    return this.loading();
  }

  get showError(): boolean {
    return !!this.error();
  }

  get errorMessage(): string {
    return this.error() ?? '';
  }

  get resultCount(): number {
    return this.results().length;
  }

  // Absolute range across all results based on current page and page size
  get resultRange(): string {
    const size = this.pageSize();
    const page = this.currentPage();
    const start = Math.max(1, (page - 1) * size + 1);
    const end = start + this.results().length - 1;
    return `${start}-${Math.max(start, end)}`;
  }

  // Absolute index for each row
  rowNumber(i: number): number {
    const size = this.pageSize();
    const page = this.currentPage();
    const start = Math.max(1, (page - 1) * size + 1);
    return start + i;
  }

  onDownload(): void {
    this.downloadCsv.emit();
  }

  onClear(): void {
    this.clear.emit();
  }

  onNextPage(): void {
    this.nextPage.emit();
  }

  onPreviousPage(): void {
    this.previousPage.emit();
  }

  // ----- Derived column helpers -----
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

  locationFor(result: { title: string; snippet: string }): string {
    const hay = `${result.title} ${result.snippet}`;
    return this.findFirstMatch(hay, this.countries());
  }

  nicheGuessFor(result: { title: string; snippet: string }): string {
    const hay = `${result.title} ${result.snippet}`;
    return this.findFirstMatch(hay, this.coachTypes());
  }

  funnelSignalsFor(result: { title: string; snippet: string }): string {
    const hay = `${result.title} ${result.snippet}`;
    const matches = this.findAllMatches(hay, this.funnelTerms());
    return matches.join('; ');
  }

  leadMagnetSignalsFor(result: { title: string; snippet: string }): string {
    const hay = `${result.title} ${result.snippet}`;
    const matches = this.findAllMatches(hay, this.leadMagnetTerms());
    return matches.join('; ');
  }

  websiteUrlFor(): string {
    // Not available from LinkedIn search result directly; left blank
    return '';
  }

  calendarOrApplyLinkFor(result: { title: string; snippet: string }): string {
    // Heuristic: return first funnel signal that implies scheduling/applying
    const signals = this.funnelSignalsFor(result).split('; ').filter(Boolean);
    const candidate = signals.find(s =>
      /book|apply|calendar|schedule|call|appointment/i.test(s)
    );
    return candidate ?? '';
  }

  recentActivitySignalFor(): string {
    // Not accessible from snippet; left blank for now
    return '';
  }

  confidenceScoreFor(): string {
    // To be implemented next
    return '';
  }
}
