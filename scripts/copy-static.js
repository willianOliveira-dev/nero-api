import fs from 'fs';
import path from 'path';

const source = path.join(process.cwd(), 'public');
const destination = path.join(process.cwd(), 'dist', 'public');

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(
                path.join(src, childItemName),
                path.join(dest, childItemName),
            );
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

if (fs.existsSync(source)) {
    console.log(`Copying ${source} to ${destination}...`);
    copyRecursiveSync(source, destination);
    console.log('Static assets copied successfully.');
} else {
    console.warn(`Source directory ${source} does not exist. Skipping copy.`);
}
