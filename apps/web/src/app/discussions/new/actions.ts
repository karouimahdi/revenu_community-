'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createDiscussion, type CreateDiscussionInput } from '@/lib/strapi/discussions';
import { StrapiRequestError } from '@/lib/strapi/client';
import { SESSION_COOKIE_NAME } from '@/lib/session';

export interface CreateDiscussionActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function createDiscussionAction(
  _prevState: CreateDiscussionActionState,
  formData: FormData,
): Promise<CreateDiscussionActionState> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    redirect('/login?next=/discussions/new');
  }

  const input: CreateDiscussionInput = {
    title: String(formData.get('title') ?? ''),
    content: String(formData.get('content') ?? ''),
    type: formData.get('type') === 'question' ? 'question' : 'discussion',
    category: String(formData.get('category') ?? ''),
  };

  let documentId: string;
  try {
    const result = await createDiscussion(input, token);
    documentId = result.data.documentId;
  } catch (error) {
    if (error instanceof StrapiRequestError) {
      return {
        error: error.fieldErrors ? undefined : error.message,
        fieldErrors: error.fieldErrors,
      };
    }
    throw error;
  }

  revalidatePath('/');
  redirect(`/discussions/${documentId}`);
}
