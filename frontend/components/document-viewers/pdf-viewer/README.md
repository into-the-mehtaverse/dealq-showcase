# PDF Viewer Component

A modular, feature-rich PDF viewer component with proper zoom, pan, and gesture support.

## Features

- **Proper Zoom Behavior**: Zoom affects only the PDF content, not the container
- **Gesture Support**: Touch and mouse gestures for panning and zooming
- **Responsive Design**: Adapts to container dimensions
- **Accessibility**: Proper ARIA labels and keyboard support
- **Performance**: Optimized rendering with CSS transforms

## Component Structure

```
pdf-viewer/
├── index.tsx              # Main container component
├── pdf-document.tsx       # PDF page rendering
├── pdf-controls.tsx       # Zoom and navigation controls
├── pdf-gesture-handler.tsx # Touch/mouse event handling
├── hooks/
│   └── use-pdf-viewport.ts # Viewport state management
└── types.ts               # TypeScript interfaces
```

## Usage

```tsx
import PdfViewer from '@/features/verification/shared/pdf-viewer';

function MyComponent() {
  return (
    <PdfViewer
      pdfUrl="/path/to/document.pdf"
      currentPage={1}
      totalPages={10}
      onPageChange={(page) => console.log('Page changed to:', page)}
      className="h-96"
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pdfUrl` | `string` | - | URL to the PDF document |
| `currentPage` | `number` | `1` | Current page number |
| `totalPages` | `number` | `25` | Total number of pages |
| `onPageChange` | `(page: number) => void` | - | Callback when page changes |
| `isLoading` | `boolean` | `false` | Loading state |
| `className` | `string` | `""` | Additional CSS classes |
| `onPageClick` | `(page: number) => void` | - | Callback when page is clicked |
| `highlightedPages` | `number[]` | `[]` | Array of highlighted page numbers |

## Gesture Controls

- **Mouse**: Click and drag to pan, scroll wheel to zoom
- **Touch**: Single finger to pan, pinch to zoom
- **Keyboard**: Use zoom controls for precise zoom levels

## Zoom Behavior

- Zoom range: 10% to 500%
- Zoom affects PDF content only, container remains fixed
- Pan allows navigation when zoomed in
- Reset button returns to 100% zoom and center position

## Best Practices

1. **Container Sizing**: Ensure the parent container has defined dimensions
2. **Performance**: Large PDFs are optimized with CSS transforms
3. **Accessibility**: All controls have proper ARIA labels
4. **Responsiveness**: Component adapts to container size changes
