import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { DiscussionForm } from './DiscussionForm';
import { createDiscussionAction } from './actions';
import type { Category } from '@/lib/strapi/schemas';

vi.mock('./actions', () => ({
  createDiscussionAction: vi.fn(),
}));

const mockedAction = vi.mocked(createDiscussionAction);

const CATEGORIES: Category[] = [{ id: 1, documentId: 'cat-1', name: 'Bourse & actions', slug: 'bourse', description: null }];

describe('DiscussionForm', () => {
  it('blocks submission and shows an inline error for a title under 10 characters, without calling the action', async () => {
    mockedAction.mockResolvedValue({});
    const user = userEvent.setup();
    renderWithProviders(<DiscussionForm categories={CATEGORIES} initialType="discussion" />);

    // 9 characters — under DiscussionForm's 10-char minimum.
    await user.type(screen.getByLabelText('Titre'), 'Trop cour');

    expect(screen.getByText('Le titre doit contenir au moins 10 caractères.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publier' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Publier' }));

    expect(mockedAction).not.toHaveBeenCalled();
  });

  it('renders the server-mapped field error returned by the action', async () => {
    mockedAction.mockResolvedValue({ fieldErrors: { title: 'Ce titre existe déjà.' } });
    const user = userEvent.setup();
    renderWithProviders(<DiscussionForm categories={CATEGORIES} initialType="discussion" />);

    await user.type(screen.getByLabelText('Titre'), 'Un titre suffisamment long');
    await user.selectOptions(screen.getByLabelText('Catégorie'), 'cat-1');
    await user.type(screen.getByLabelText('Contenu'), 'Un contenu valide pour la discussion.');
    await user.click(screen.getByRole('button', { name: 'Publier' }));

    await waitFor(() => expect(mockedAction).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Ce titre existe déjà.')).toBeInTheDocument();
  });
});
