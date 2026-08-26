import asyncio
import sys

TARGET_HOST = '127.0.0.1'
TARGET_PORT = 3001
PORTS = [3000, 8080, 5000]
BUFFER_SIZE = 65536

async def pipe(reader, writer):
    try:
        while True:
            data = await reader.read(BUFFER_SIZE)
            if not data:
                break
            writer.write(data)
            await writer.drain()
    except (asyncio.CancelledError, ConnectionResetError, BrokenPipeError):
        pass
    except Exception:
        pass
    finally:
        try:
            writer.close()
            await writer.wait_closed()
        except Exception:
            pass

async def handle_client(client_reader, client_writer):
    try:
        target_reader, target_writer = await asyncio.open_connection(TARGET_HOST, TARGET_PORT)
        await asyncio.gather(
            pipe(client_reader, target_writer),
            pipe(target_reader, client_writer),
            return_exceptions=True
        )
    except Exception:
        pass
    finally:
        try:
            client_writer.close()
            await client_writer.wait_closed()
        except Exception:
            pass

async def main():
    servers = []
    for port in PORORTS if 'PORORTS' in locals() else PORTS:
        try:
            srv = await asyncio.start_server(handle_client, '0.0.0.0', port, reuse_address=True)
            servers.append(srv)
            print(f"[✓] Proxy active on 0.0.0.0:{port} -> Next.js (127.0.0.1:{TARGET_PORT})")
        except Exception as e:
            print(f"[!] Could not bind port {port}: {e}")

    print("=" * 60)
    print("  Iraq Esports Hub - LAN Server is Live")
    print("  iPad URLs to try in Safari / Chrome:")
    print("  1) http://192.168.1.16:3000")
    print("  2) http://192.168.1.16:8080")
    print("  3) http://192.168.1.16:5000")
    print("=" * 60)
    
    await asyncio.gather(*(s.serve_forever() for s in servers))

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass