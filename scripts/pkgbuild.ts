import { writeFileSync } from 'fs';
import { version, description, license } from '../package.json';

const file = `
# Maintainer: Yuuto <notyuuto@outlook.com>
pkgname=deezer-discord-rpc-bin
pkgver=${version}
pkgrel=1
pkgdesc="${description}"
arch=('x86_64')
url="https://github.com/JustYuuto/deezer-discord-rpc"
license=('${license}')
depends=('electron')
source=("https://github.com/JustYuuto/deezer-discord-rpc/releases/download/latest/DeezerDiscordRPC-linux-amd64.deb")

package() {
    bsdtar -xf "$srcdir/deezer-discord-rpc_$pkgver_amd64.deb" -C "$pkgdir"
    
    install -Dm755 "$pkgdir/usr/lib/$pkgname/deezer-discord-rpc" "$pkgdir/usr/bin/deezer-discord-rpc"
    ln -s "/usr/lib/$pkgname/deezer-discord-rpc" "$pkgdir/usr/bin/deezer-discord-rpc"
    
    install -Dm644 "$pkgdir/usr/share/icons/hicolor/128x128/apps/deezer-discord-rpc.png" "$pkgdir/usr/share/icons/hicolor/128x128/apps/$pkgname.png"
    
    install -Dm644 "$pkgdir/usr/share/applications/deezer-discord-rpc.desktop" "$pkgdir/usr/share/applications/deezer-discord-rpc.desktop"
}
`;
writeFileSync('PKGBUILD', file.trim());