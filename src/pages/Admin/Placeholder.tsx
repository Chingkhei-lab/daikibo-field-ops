export function PlaceholderPage({ title }: { title: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8 bg-dashed border-2 border-gray-200 rounded-lg bg-gray-50/50">
            <h1 className="text-2xl font-bold text-gray-400 mb-2">{title}</h1>
            <p className="text-muted-foreground">This module is coming soon.</p>
        </div>
    );
}
