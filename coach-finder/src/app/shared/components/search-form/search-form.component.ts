import { Component, signal, output, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleSearchService } from '../../../core/services/google-search.service';

const COACH_TYPES = [
  'Fitness',
  'Dating',
  'Mindset',
  'Business',
  'Wellness',
  'Life',
  'Career',
  'Health',
  'Nutrition',
  'Relationship',
  'Leadership',
  'Performance',
  'Executive',
  'Health & Wellness',
  'Mental Health',
  'Personal Development',
];

const FUNNEL_TERMS = [
  'book a call',
  'discovery call',
  'strategy call',
  'apply now',
  'application',
  'work with me',
  'private coaching',
  'mastermind',
  'retreat',
];

const LEAD_MAGNET_TERMS = [
  'newsletter',
  'subscribe',
  'free webinar',
  'masterclass',
  'training',
  'free guide',
  'playbook',
  'checklist',
  'waitlist',
  'challenge',
];

const INCOME_PROXY_TERMS = [
  'founder',
  'CEO',
  'entrepreneur',
  'creator',
  'podcast host',
  'speaker',
  'bestselling author',
  'clients',
  'testimonials',
  'results',
];

const EXCLUSION_TERMS = [
  'recruiter',
  'hiring',
  'career coach',
  'resume',
  'job search',
  'HR',
  'real estate',
  'realtor',
  'insurance',
];

const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Ireland',
  'Europe',
  'India',
  'Australia',
  'New Zealand',
];

@Component({
  selector: 'app-search-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-form.component.html',
  styleUrl: './search-form.component.scss',
})
export class SearchFormComponent {
  readonly coachTypes = COACH_TYPES;
  readonly countries = COUNTRIES;
  readonly funnelTerms = FUNNEL_TERMS;
  readonly leadMagnetTerms = LEAD_MAGNET_TERMS;
  readonly incomeProxyTerms = INCOME_PROXY_TERMS;
  readonly exclusionTerms = EXCLUSION_TERMS;

  private googleSearchService = inject(GoogleSearchService);

  apiKey = signal('');
  searchEngineId = signal('');
  selectedCoachTypes = signal<string[]>([]);
  selectedCountries = signal<string[]>([]);
  selectedFunnelTerms = signal<string[]>([]);
  selectedLeadMagnetTerms = signal<string[]>([]);
  selectedIncomeProxyTerms = signal<string[]>([]);
  selectedExclusionTerms = signal<string[]>([]);
  customCoachTypeInput = signal('');
  customCountryInput = signal('');
  customFunnelTermInput = signal('');
  customLeadMagnetTermInput = signal('');
  customIncomeProxyTermInput = signal('');
  customExclusionTermInput = signal('');
  resultsPerSearch = signal(10);

  readonly search = output<{
    apiKey: string;
    searchEngineId: string;
    coachTypes: string[];
    countries: string[];
    funnelTerms: string[];
    leadMagnetTerms: string[];
    incomeProxyTerms: string[];
    exclusionTerms: string[];
    resultsPerSearch: number;
  }>();

  readonly configUpdated = output<{
    apiKey: string;
    searchEngineId: string;
  }>();

  readonly parametersChanged = output<{
    coachTypes: string[];
    countries: string[];
    funnelTerms: string[];
    leadMagnetTerms: string[];
    incomeProxyTerms: string[];
    exclusionTerms: string[];
  }>();

  constructor() {
    effect(() => {
      this.parametersChanged.emit({
        coachTypes: this.selectedCoachTypes(),
        countries: this.selectedCountries(),
        funnelTerms: this.selectedFunnelTerms(),
        leadMagnetTerms: this.selectedLeadMagnetTerms(),
        incomeProxyTerms: this.selectedIncomeProxyTerms(),
        exclusionTerms: this.selectedExclusionTerms(),
      });
    });
  }

  isCoachTypeSelected(type: string): boolean {
    return this.selectedCoachTypes().includes(type);
  }

  addCoachType(type: string): void {
    if (!this.isCoachTypeSelected(type) && type.trim()) {
      this.selectedCoachTypes.update(types => [...types, type]);
    }
  }

  removeCoachType(type: string): void {
    this.selectedCoachTypes.update(types => types.filter(t => t !== type));
  }

  addCustomCoachType(): void {
    const type = this.customCoachTypeInput().trim();
    if (type) {
      this.addCoachType(type);
      this.customCoachTypeInput.set('');
    }
  }

  handleCoachTypeInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addCustomCoachType();
    }
  }

  isCountrySelected(country: string): boolean {
    return this.selectedCountries().includes(country);
  }

  addCountry(country: string): void {
    if (!this.isCountrySelected(country) && country.trim()) {
      this.selectedCountries.update(countries => [...countries, country]);
    }
  }

  removeCountry(country: string): void {
    this.selectedCountries.update(countries => countries.filter(c => c !== country));
  }

  handleCountrySelect(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    if (target) {
      this.addCountry(target.value);
    }
  }

  addCustomCountry(): void {
    const country = this.customCountryInput().trim();
    if (country) {
      this.addCountry(country);
      this.customCountryInput.set('');
    }
  }

  handleCountryInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addCustomCountry();
    }
  }

  isFunnelTermSelected(term: string): boolean {
    return this.selectedFunnelTerms().includes(term);
  }

  addFunnelTerm(term: string): void {
    if (!this.isFunnelTermSelected(term) && term.trim()) {
      this.selectedFunnelTerms.update(terms => [...terms, term]);
    }
  }

  removeFunnelTerm(term: string): void {
    this.selectedFunnelTerms.update(terms => terms.filter(t => t !== term));
  }

  addCustomFunnelTerm(): void {
    const term = this.customFunnelTermInput().trim();
    if (term) {
      this.addFunnelTerm(term);
      this.customFunnelTermInput.set('');
    }
  }

  handleFunnelTermInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addCustomFunnelTerm();
    }
  }

  isLeadMagnetTermSelected(term: string): boolean {
    return this.selectedLeadMagnetTerms().includes(term);
  }

  addLeadMagnetTerm(term: string): void {
    if (!this.isLeadMagnetTermSelected(term) && term.trim()) {
      this.selectedLeadMagnetTerms.update(terms => [...terms, term]);
    }
  }

  removeLeadMagnetTerm(term: string): void {
    this.selectedLeadMagnetTerms.update(terms => terms.filter(t => t !== term));
  }

  addCustomLeadMagnetTerm(): void {
    const term = this.customLeadMagnetTermInput().trim();
    if (term) {
      this.addLeadMagnetTerm(term);
      this.customLeadMagnetTermInput.set('');
    }
  }

  handleLeadMagnetTermInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addCustomLeadMagnetTerm();
    }
  }

  isIncomeProxyTermSelected(term: string): boolean {
    return this.selectedIncomeProxyTerms().includes(term);
  }

  addIncomeProxyTerm(term: string): void {
    if (!this.isIncomeProxyTermSelected(term) && term.trim()) {
      this.selectedIncomeProxyTerms.update(terms => [...terms, term]);
    }
  }

  removeIncomeProxyTerm(term: string): void {
    this.selectedIncomeProxyTerms.update(terms => terms.filter(t => t !== term));
  }

  addCustomIncomeProxyTerm(): void {
    const term = this.customIncomeProxyTermInput().trim();
    if (term) {
      this.addIncomeProxyTerm(term);
      this.customIncomeProxyTermInput.set('');
    }
  }

  handleIncomeProxyTermInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addCustomIncomeProxyTerm();
    }
  }

  isExclusionTermSelected(term: string): boolean {
    return this.selectedExclusionTerms().includes(term);
  }

  addExclusionTerm(term: string): void {
    if (!this.isExclusionTermSelected(term) && term.trim()) {
      this.selectedExclusionTerms.update(terms => [...terms, term]);
    }
  }

  removeExclusionTerm(term: string): void {
    this.selectedExclusionTerms.update(terms => terms.filter(t => t !== term));
  }

  addCustomExclusionTerm(): void {
    const term = this.customExclusionTermInput().trim();
    if (term) {
      this.addExclusionTerm(term);
      this.customExclusionTermInput.set('');
    }
  }

  handleExclusionTermInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addCustomExclusionTerm();
    }
  }

  onSearch(): void {
    const apiKey = this.apiKey();
    const searchEngineId = this.searchEngineId();
    const coachTypes = this.selectedCoachTypes();
    const countries = this.selectedCountries();
    const funnelTerms = this.selectedFunnelTerms();
    const leadMagnetTerms = this.selectedLeadMagnetTerms();
    const incomeProxyTerms = this.selectedIncomeProxyTerms();
    const exclusionTerms = this.selectedExclusionTerms();
    const resultsPerSearch = this.resultsPerSearch();

    if (!apiKey || !searchEngineId) {
      return;
    }

    this.configUpdated.emit({ apiKey, searchEngineId });
    this.search.emit({ apiKey, searchEngineId, coachTypes, countries, funnelTerms, leadMagnetTerms, incomeProxyTerms, exclusionTerms, resultsPerSearch });
  }

  isFormValid(): boolean {
    return this.apiKey().length > 0 && this.searchEngineId().length > 0;
  }

  protected readonly parseInt = parseInt;
}
