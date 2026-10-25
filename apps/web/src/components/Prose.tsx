import { formatBody } from '@/lib/formatBody';

export function Prose({ content }: { content: string }) {
  return (
    <div
      className="prose-content text-[15px] leading-relaxed text-ink"
      dangerouslySetInnerHTML={{ __html: formatBody(content) }}
    />
  );
}
