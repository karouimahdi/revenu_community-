'use client';

import { useActionState, useState } from 'react';
import { createDiscussionAction, type CreateDiscussionActionState } from './actions';
import type { Category } from '@/lib/strapi/schemas';
import { HelpIcon, MessageIcon } from '@/components/icons';

const MIN_TITLE_LENGTH = 10;
const initialState: CreateDiscussionActionState = {};

const TYPES = [
  {
    value: 'question' as const,
    Icon: HelpIcon,
    label: 'Poser une question',
    hint: "Obtenez l'aide des membres et de la rédaction",
  },
  {
    value: 'discussion' as const,
    Icon: MessageIcon,
    label: 'Lancer une discussion',
    hint: 'Partagez une expérience, un avis, une actualité',
  },
];

function typeCardClass(active: boolean) {
  return `relative flex flex-col gap-1 rounded-xl border-[1.5px] p-3.5 text-left cursor-pointer ${
    active ? 'border-brand bg-brand/5' : 'border-line'
  }`;
}

interface DiscussionFormProps {
  categories: Category[];
  initialType: 'question' | 'discussion';
}

export function DiscussionForm({ categories, initialType }: DiscussionFormProps) {
  const [state, formAction, isPending] = useActionState(createDiscussionAction, initialState);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'question' | 'discussion'>(initialType);
  const titleTooShort = title.length > 0 && title.length < MIN_TITLE_LENGTH;

  return (
    <form action={formAction} className="space-y-4 rounded-[14px] border border-line bg-surface p-6 shadow-card">
      <h1 className="font-display text-2xl font-bold text-ink">Publier une discussion</h1>

      <fieldset className="grid grid-cols-2 gap-2.5">
        <legend className="sr-only">Type de publication</legend>
        {TYPES.map(({ value, Icon, label, hint }) => (
          <label key={value} className={typeCardClass(type === value)}>
            <input
              type="radio"
              name="type"
              value={value}
              checked={type === value}
              onChange={() => setType(value)}
              className="absolute opacity-0"
            />
            <Icon className={`h-[22px] w-[22px] ${type === value ? 'text-brand' : 'text-ink-2'}`} />
            <b className="text-[14.5px] text-ink">{label}</b>
            <small className="text-[12.5px] leading-snug text-ink-3">{hint}</small>
          </label>
        ))}
      </fieldset>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-ink-2">
          Titre
        </label>
        <input
          id="title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          className="mt-1 w-full rounded-[9px] border border-line p-2.5 text-[15px] text-ink outline-none focus:border-brand"
        />
        {titleTooShort && <p className="mt-1 text-sm text-alert">Le titre doit contenir au moins 10 caractères.</p>}
        {state.fieldErrors?.title && <p className="mt-1 text-sm text-alert">{state.fieldErrors.title}</p>}
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-ink-2">
          Catégorie
        </label>
        <select
          id="category"
          name="category"
          required
          defaultValue=""
          className="mt-1 w-full rounded-[9px] border border-line p-2.5 text-[15px] text-ink"
        >
          <option value="" disabled>
            Choisir un espace…
          </option>
          {categories.map((category) => (
            <option key={category.documentId} value={category.documentId}>
              {category.name}
            </option>
          ))}
        </select>
        {state.fieldErrors?.category && <p className="mt-1 text-sm text-alert">{state.fieldErrors.category}</p>}
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-ink-2">
          Contenu
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={6}
          className="mt-1 w-full resize-none rounded-[9px] border border-line p-2.5 text-[15px] text-ink outline-none focus:border-brand"
        />
        {state.fieldErrors?.content && <p className="mt-1 text-sm text-alert">{state.fieldErrors.content}</p>}
      </div>

      {state.error && <p className="text-sm text-alert">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending || titleTooShort}
        className="rounded-[9px] bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isPending ? 'Publication…' : 'Publier'}
      </button>
    </form>
  );
}
