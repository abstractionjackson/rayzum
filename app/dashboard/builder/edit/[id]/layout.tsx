export async function generateStaticParams() {
    // Generate a placeholder to satisfy static export
    // Actual routing is handled client-side with localStorage
    return [{ id: '1' }]
}

export default function EditLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
