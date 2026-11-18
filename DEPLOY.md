# Hướng dẫn Docker & triển khai

Ứng dụng Node.js chạy trong Docker, đặt sau Nginx reverse proxy trên server Ubuntu.

```
Internet -> UFW (22/80/443) -> Nginx :80 -> 127.0.0.1:8000 -> container :8000 (app)
```

## 1. Cấu trúc file

| File | Vai trò |
|---|---|
| `Dockerfile` | Build image (multi-stage, chạy bằng user `node`, có HEALTHCHECK) |
| `.dockerignore` | Loại file không đưa vào image |
| `docker-compose.yml` | Chạy container, ánh xạ cổng, health check, giới hạn log |
| `nginx/myapp.conf` | Cấu hình Nginx reverse proxy |
| `nginx/connection_upgrade.conf` | Hỗ trợ WebSocket (đặt vào `/etc/nginx/conf.d/`) |
| `.env.example` | Mẫu biến môi trường (file `.env` thật **không** push lên GitHub) |

## 2. Port và ánh xạ

| Thành phần | Port | Ghi chú |
|---|---|---|
| App trong container | `8000` | App phải lắng nghe `process.env.PORT` và địa chỉ `0.0.0.0` |
| Host (Docker publish) | `127.0.0.1:8000` | Chỉ bind localhost, không ra ngoài mạng |
| Nginx | `80` (và `443` nếu bật HTTPS) | Người dùng truy cập qua đây |
| UFW | mở `22`, `80`, `443` | **Không** mở 8000 |

Ánh xạ: `127.0.0.1:8000:8000` có dạng `<IP host>:<port host>:<port container>`.
Nginx chuyển tiếp qua `proxy_pass http://127.0.0.1:8000;`.

> Không viết `"8000:8000"` (thiếu `127.0.0.1`): Docker sẽ mở cổng ra toàn mạng và bỏ qua UFW.

## 3. Yêu cầu với code ứng dụng

Để Dockerfile và cấu hình khớp với code, app cần:

1. Có `package.json` với script `start` (ví dụ `"start": "node index.js"`). NestJS/TypeScript cần thêm script `build`, Dockerfile tự chạy nếu có.
2. Lắng nghe đúng cổng và địa chỉ:
   ```js
   app.listen(process.env.PORT || 8000, '0.0.0.0');
   ```
3. Có endpoint health check trả mã 200:
   ```js
   app.get('/health', (req, res) => res.json({ status: 'ok' }));
   ```
   Nếu app dùng đường dẫn khác, đổi `HEALTH_PATH` trong `.env`.
4. Không ghi cứng mật khẩu, secret trong code; đọc từ `process.env`.

## 4. Build và chạy thử trên máy local

```bash
# Build image
docker build -t myapp:latest .

# Chạy container (bind localhost)
docker run -d --name myapp --env-file .env -p 127.0.0.1:8000:8000 myapp:latest

# Xem log, trạng thái
docker logs -f myapp
docker ps

# Dừng và xóa
docker rm -f myapp
```

Hoặc dùng Docker Compose:

```bash
cp .env.example .env        # rồi điền giá trị thật
docker compose up -d --build
docker compose ps
docker compose logs -f
docker compose down
```

## 5. Triển khai lần đầu trên server

Giả định server đã cài Docker, Nginx, UFW (theo `setup.sh`).

```bash
# 1. Lấy code
cd /opt/app
git clone <URL_REPO_GITHUB> myapp && cd myapp

# 2. Tạo file môi trường thật (chỉ tồn tại trên server)
cp .env.example .env
nano .env
chmod 600 .env

# 3. Chạy container
docker compose up -d --build

# 4. Cấu hình Nginx
sudo cp nginx/connection_upgrade.conf /etc/nginx/conf.d/   # bỏ qua nếu setup.sh đã tạo
sudo cp nginx/myapp.conf /etc/nginx/sites-available/myapp
sudo nano /etc/nginx/sites-available/myapp                  # sửa server_name
sudo ln -sf /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/myapp
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## 6. Cập nhật ứng dụng (khi có code mới)

**Cách A: build ngay trên server (đơn giản)**

```bash
cd /opt/app/myapp
git pull origin main
docker compose up -d --build
docker image prune -f        # dọn image cũ
```

**Cách B: dùng `deploy.sh` (có health check + rollback + thông báo Telegram)**

Đẩy image lên registry (ví dụ GHCR), rồi trên server:

```bash
/opt/app/deploy/deploy.sh v1.0.1
```

Cách B giữ container cũ để tự rollback nếu bản mới không qua health check.

**Rollback thủ công (cách A):**

```bash
git log --oneline -5
git checkout <commit_cũ>
docker compose up -d --build
```

## 7. Kiểm tra sau khi deploy

| Kiểm tra | Lệnh | Kết quả mong đợi |
|---|---|---|
| Container chạy | `docker ps` | `myapp` trạng thái `Up ... (healthy)` |
| Health check nội bộ | `curl -i http://127.0.0.1:8000/health` | `200 OK` |
| Qua Nginx | `curl -i http://<IP_hoặc_domain>/health` | `200 OK` |
| Trình duyệt | Mở `http://<IP_hoặc_domain>` | Thấy giao diện/response của app |
| Cổng 8000 bị chặn từ ngoài | Từ máy khác: `curl --max-time 5 http://<IP>:8000` | Timeout / không kết nối được |
| Cổng đang lắng nghe | `sudo ss -tulpn \| grep 8000` | Hiện `127.0.0.1:8000`, không phải `0.0.0.0:8000` |
| Log app | `docker logs --tail 50 myapp` | Không có lỗi |
| Log Nginx | `sudo tail -f /var/log/nginx/myapp_error.log` | Không có lỗi |

## 8. Lỗi thường gặp

| Triệu chứng | Nguyên nhân / cách xử lý |
|---|---|
| `502 Bad Gateway` | Container chưa chạy hoặc sai cổng. Kiểm tra `docker ps`, `docker logs myapp` |
| Container `unhealthy` | App không có `/health` hoặc không lắng nghe `0.0.0.0`. Xem mục 3 |
| `env file .env not found` | Quên `cp .env.example .env` |
| `permission denied` khi chạy docker | User chưa thuộc nhóm `docker`: `sudo usermod -aG docker $USER` rồi đăng nhập lại |
| `nginx -t` báo `connection_upgrade` lỗi | Thiếu hoặc trùng file `connection_upgrade.conf` trong `/etc/nginx/conf.d/` |

## 9. Bảo mật khi push lên GitHub

- `.env` đã nằm trong `.gitignore` và `.dockerignore`. Chỉ push `.env.example` (giá trị giả).
- Kiểm tra trước khi push: `git status` và `git diff --staged`, đảm bảo không có token, mật khẩu.
- Nếu lỡ push secret: đổi (revoke) secret đó ngay, việc xóa commit không đủ vì lịch sử Git vẫn còn.
