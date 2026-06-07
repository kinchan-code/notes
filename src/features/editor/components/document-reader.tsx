interface DocumentReaderProps {
  html: string
}

export function DocumentReader({ html }: Readonly<DocumentReaderProps>) {
  const isEmpty = !html || html === '<p></p>'

  return (
    <article className="prose-view min-h-[60vh] px-4 py-4 sm:min-h-[500px] sm:px-8 sm:py-6">
      {isEmpty ? (
        <p className="text-muted-foreground">This document is empty.</p>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </article>
  )
}
