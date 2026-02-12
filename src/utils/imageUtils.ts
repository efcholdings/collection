export function getValidImageUrl(path: string | null | undefined): string | null {
    if (!path) return null;

    // List of extensions supported by modern browsers
    const supportedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];

    const lowerPath = path.toLowerCase();

    // Check if the path ends with any of the supported extensions
    const isSupported = supportedExtensions.some(ext => lowerPath.endsWith(ext));

    return isSupported ? path : null;
}
