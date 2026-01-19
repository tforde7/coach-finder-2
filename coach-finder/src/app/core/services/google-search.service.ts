import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signal, computed } from '@angular/core';

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  formattedUrl: string;
  htmlTitle: string;
  htmlSnippet: string;
  htmlFormattedUrl: string;
}

export interface SearchResponse {
  kind: string;
  url: {
    type: string;
    template: string;
  };
  queries: {
    request: Array<{
      title: string;
      totalResults: string;
      searchTerms: string;
      count: number;
      startIndex: number;
      inputEncoding: string;
      outputEncoding: string;
      safe: string;
      cx: string;
    }>;
    nextPage: Array<{
      title: string;
      totalResults: string;
      searchTerms: string;
      count: number;
      startIndex: number;
      inputEncoding: string;
      outputEncoding: string;
      safe: string;
      cx: string;
    }>;
  };
  context: {
    title: string;
  };
  searchInformation: {
    searchTime: number;
    totalResults: string;
    formattedTotalResults: string;
    formattedSearchTime: string;
  };
  items: SearchResult[];
}

@Injectable({
  providedIn: 'root',
})
export class GoogleSearchService {
  private readonly API_URL = 'https://www.googleapis.com/customsearch/v1';
  private apiKey = signal('');
  private searchEngineId = signal('');
  private currentQuery = signal('');

  private results = signal<SearchResult[]>([]);
  private loading = signal(false);
  private error = signal<string | null>(null);
  private totalResults = signal(0);
  private currentPage = signal(1);
  private resultsPerPage = signal(10); // per-request size enforced by API (max 10)
  private pageSize = signal(10);       // logical page size (total results per UI page)

  results$ = computed(() => this.results());
  loading$ = computed(() => this.loading());
  error$ = computed(() => this.error());
  totalResults$ = computed(() => this.totalResults());
  currentPage$ = computed(() => this.currentPage());
  currentQuery$ = computed(() => this.currentQuery());
  pageSize$ = computed(() => this.pageSize());
  hasNextPage = computed(() => {
    const total = this.totalResults();
    const page = this.currentPage();
    const size = this.pageSize();
    return page * size < total;
  });
  hasPreviousPage = computed(() => this.currentPage() > 1);

  constructor(private http: HttpClient) {}

  setApiKey(apiKey: string): void {
    this.apiKey.set(apiKey);
  }

  setSearchEngineId(engineId: string): void {
    this.searchEngineId.set(engineId);
  }

  async search(coachTypes: string[] = [], countries: string[] = [], funnelTerms: string[] = [], leadMagnetTerms: string[] = [], incomeProxyTerms: string[] = [], exclusionTerms: string[] = [], page: number = 1, resultsPerSearch: number = 10, maxResults: number = 100): Promise<SearchResult[]> {
    const apiKey = this.apiKey();
    const cx = this.searchEngineId();

    if (!apiKey || !cx) {
      this.error.set('API key and Search Engine ID are required');
      return [];
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const query = this.buildQuery(coachTypes, countries, funnelTerms, leadMagnetTerms, incomeProxyTerms, exclusionTerms);
      this.currentQuery.set(query);
      this.currentPage.set(page);

      // Google CSE constraints
      const API_PER_REQUEST_MAX = 10;   // num param must be <= 10
      const API_TOTAL_MAX = 100;        // CSE only returns first 100 results

      // Normalize inputs (guard against string values coming from templates)
      const requestedTotal = Number(resultsPerSearch);
      const capFromCaller = Number(maxResults);

      // Desired total results per UI page (cap to API_TOTAL_MAX)
      const desiredTotal = Math.max(
        1,
        Math.min(
          isNaN(capFromCaller) ? Number.POSITIVE_INFINITY : capFromCaller,
          isNaN(requestedTotal) ? API_PER_REQUEST_MAX : requestedTotal,
          API_TOTAL_MAX
        )
      );

      // Always respect API per-request limit
      const perRequest = API_PER_REQUEST_MAX;

      // Track per-request and logical page size
      this.resultsPerPage.set(perRequest);
      this.pageSize.set(desiredTotal);

      // Accumulate results for the requested UI page
      // Base start index for this page (1-based)
      const baseStartIndex = (page - 1) * desiredTotal + 1;

      let collected: SearchResult[] = [];
      let totalResultsFromApi = 0;
      let hasMoreResults = true;

      // Loop in steps of perRequest (10) until we collect desiredTotal items (or hit API caps)
      for (let offset = 0; hasMoreResults && collected.length < desiredTotal; offset += perRequest) {
        const startIndex = baseStartIndex + offset;

        // Do not request beyond API total cap (if known). We still need first response to know totals.
        // Requests beyond API's accessible range will naturally return empty items and break.
        const response = await this.http
          .get<SearchResponse>(this.API_URL, {
            params: {
              key: apiKey,
              cx: cx,
              q: query,
              num: perRequest.toString(), // enforce <= 10
              start: startIndex.toString(),
            },
          })
          .toPromise();

        if (!response?.items || response.items.length === 0) {
          hasMoreResults = false;
          break;
        }

        collected = [...collected, ...response.items];
        totalResultsFromApi = parseInt(response.searchInformation.totalResults, 10) || 0;

        // If we've already reached the maximum accessible by API or the desired page size, stop
        const maxReachableForThisPage = Math.min(totalResultsFromApi - (baseStartIndex - 1), desiredTotal, API_TOTAL_MAX - (baseStartIndex - 1));
        hasMoreResults = collected.length < maxReachableForThisPage;
      }

      const finalSlice = collected.slice(0, desiredTotal);
      this.results.set(finalSlice);
      // Show Google's reported total count (not our accessible cap) for UI display
      this.totalResults.set(totalResultsFromApi);
      return finalSlice;
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Search failed');
      this.results.set([]);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  private buildQuery(coachTypes: string[], countries: string[], funnelTerms: string[], leadMagnetTerms: string[], incomeProxyTerms: string[], exclusionTerms: string[] = []): string {
    const linkedinFilter = 'site:linkedin.com/in/';
    const coachKeywords = 'coach OR coaching OR mentor';

    const coachTypeFilter = coachTypes.length > 0
      ? `(${coachTypes.map(type => `${type} coach OR ${type} coaching`).join(' OR ')})`
      : `(${coachKeywords})`;

    const countryFilter = countries.length > 0
      ? `(${countries.join(' OR ')})`
      : '';

    const funnelTermsFilter = funnelTerms.length > 0
      ? `(${funnelTerms.join(' OR ')})`
      : '';

    const leadMagnetTermsFilter = leadMagnetTerms.length > 0
      ? `(${leadMagnetTerms.join(' OR ')})`
      : '';

    const incomeProxyTermsFilter = incomeProxyTerms && incomeProxyTerms.length > 0
      ? `(${incomeProxyTerms.map(term => (/\s/.test(term) && !/^".*"$/.test(term) ? `"${term}"` : term)).join(' OR ')})`
      : '';

    // Build the query with proper AND grouping
    const filters = [coachTypeFilter];
    if (countryFilter) filters.push(countryFilter);
    if (funnelTermsFilter) filters.push(funnelTermsFilter);
    if (leadMagnetTermsFilter) filters.push(leadMagnetTermsFilter);
    if (incomeProxyTermsFilter) filters.push(incomeProxyTermsFilter);

    // Quote multi-word exclusion terms to ensure correct matching
    const quoteIfNeeded = (term: string) =>
      (/\s/.test(term) && !/^".*"$/.test(term) ? `"${term}"` : term);

    // Group all AND filters together, then apply the NOT group outside
    const coreGroup = `(${filters.join(' AND ')})`;

    // Add individual exclusion terms, each with its own "-" operator
    // This ensures each exclusion is applied independently
    const exclusionFilter = exclusionTerms.length > 0
      ? ` ${exclusionTerms.map(term => `-(${quoteIfNeeded(term)})`).join(' ')}`
      : '';

    const query = `${linkedinFilter} ${coreGroup}${exclusionFilter}`.trim();

    return query;
  }

  clearResults(): void {
    this.results.set([]);
    this.error.set(null);
    this.totalResults.set(0);
    this.currentPage.set(1);
    this.currentQuery.set('');
  }
}
