import {
  customTextApi,
  type CustomTextSummary,
  type CustomTextDetail,
  type TextRevision,
} from '@/core/ipc';

let texts = $state<CustomTextSummary[]>([]);
let activeText = $state<CustomTextDetail | null>(null);
let revisions = $state<TextRevision[]>([]);
let searchQuery = $state<string>('');
let sortOption = $state<'updated_at' | 'title' | 'word_count'>('updated_at');
let isLoading = $state<boolean>(false);
let error = $state<string | null>(null);

function sortSummaries(
  list: CustomTextSummary[],
  sort: 'updated_at' | 'title' | 'word_count'
): CustomTextSummary[] {
  const sorted = [...list];
  if (sort === 'title') {
    sorted.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
  } else if (sort === 'word_count') {
    sorted.sort((a, b) => b.word_count - a.word_count);
  } else {
    sorted.sort((a, b) => {
      const diff = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      if (diff !== 0) return diff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }
  return sorted;
}

export async function fetchTexts() {
  isLoading = true;
  error = null;
  try {
    const res = await customTextApi.list(
      searchQuery.trim() || undefined,
      sortOption
    );
    texts = sortSummaries(res, sortOption);
  } catch (err: unknown) {
    console.error('Failed to fetch custom texts:', err);
    error = err instanceof Error ? err.message : String(err);
  } finally {
    isLoading = false;
  }
}

export async function loadText(id: string): Promise<CustomTextDetail | null> {
  isLoading = true;
  error = null;
  try {
    const detail = await customTextApi.get(id);
    activeText = detail;
    if (detail) {
      revisions = await customTextApi.revisions(id);
    }
    return detail;
  } catch (err: unknown) {
    console.error('Failed to load text detail:', err);
    error = err instanceof Error ? err.message : String(err);
    return null;
  } finally {
    isLoading = false;
  }
}

export async function createText(title: string, body: string, language = 'en') {
  isLoading = true;
  try {
    const created = await customTextApi.create(title, body, language);
    await fetchTexts();
    return created;
  } finally {
    isLoading = false;
  }
}

export async function updateText(id: string, title: string, body: string, baseRevision: number) {
  isLoading = true;
  try {
    const updated = await customTextApi.update(id, title, body, baseRevision);
    activeText = updated;
    await fetchTexts();
    revisions = await customTextApi.revisions(id);
    return updated;
  } finally {
    isLoading = false;
  }
}

export async function deleteText(id: string) {
  try {
    await customTextApi.delete(id);
    texts = texts.filter((t) => t.id !== id);
  } catch (err) {
    console.error('Failed to delete text:', err);
  }
}

export async function duplicateText(id: string) {
  try {
    await customTextApi.duplicate(id);
    await fetchTexts();
  } catch (err) {
    console.error('Failed to duplicate text:', err);
  }
}

export async function restoreRevision(id: string, revisionNumber: number) {
  try {
    const restored = await customTextApi.restore(id, revisionNumber);
    activeText = restored;
    revisions = await customTextApi.revisions(id);
    await fetchTexts();
    return restored;
  } catch (err) {
    console.error('Failed to restore revision:', err);
    return null;
  }
}

export async function loadRevisions(id: string) {
  try {
    revisions = await customTextApi.revisions(id);
    return revisions;
  } catch (err) {
    console.error('Failed to load revisions:', err);
    return [];
  }
}

export async function loadRevisionDiff(id: string, targetRevision: number, baseRevision?: number) {
  try {
    return await customTextApi.revisionDiff(id, targetRevision, baseRevision);
  } catch (err) {
    console.error('Failed to load revision diff:', err);
    return null;
  }
}

export function resetCustomTextState(): void {
  texts = [];
  activeText = null;
  revisions = [];
  searchQuery = '';
  sortOption = 'updated_at';
  isLoading = false;
  error = null;
}

export function useCustomTextStore() {
  return {
    get texts() {
      return texts;
    },
    set texts(v: CustomTextSummary[]) {
      texts = v;
    },
    get activeText() {
      return activeText;
    },
    set activeText(v: CustomTextDetail | null) {
      activeText = v;
    },
    get revisions() {
      return revisions;
    },
    set revisions(v: TextRevision[]) {
      revisions = v;
    },
    get searchQuery() {
      return searchQuery;
    },
    set searchQuery(v: string) {
      searchQuery = v;
    },
    get sortOption() {
      return sortOption;
    },
    set sortOption(v: 'updated_at' | 'title' | 'word_count') {
      sortOption = v;
      if (texts.length > 0) {
        texts = sortSummaries(texts, v);
      }
    },
    get isLoading() {
      return isLoading;
    },
    set isLoading(v: boolean) {
      isLoading = v;
    },
    get error() {
      return error;
    },
    set error(v: string | null) {
      error = v;
    },
    fetchTexts,
    loadText,
    loadRevisions,
    loadRevisionDiff,
    createText,
    updateText,
    deleteText,
    duplicateText,
    restoreRevision,
    resetCustomTextState,
  };
}

export const customTextStore = useCustomTextStore();

