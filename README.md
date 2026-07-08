# BSI Auto Attendance Bot 🚀

Bot Node.js otomatis menggunakan Puppeteer untuk memantau dan melakukan absensi otomatis di e-learning BSI, dilengkapi dengan notifikasi melalui Discord.

## Fitur Utama
*   **Auto Login:** Secara otomatis login ke portal BSI menggunakan NIM dan Password Anda.
*   **Bypass Captcha:** Otomatis menyelesaikan captcha matematika penjumlahan sederhana.
*   **Cek Jadwal Kuliah:** Memantau kelas kuliah reguler maupun kuliah pengganti setiap menit.
*   **Auto Absen:** Klik otomatis tombol absensi ketika kelas sudah dimulai.
*   **Notifikasi Discord:** Mengirim pesan status absensi langsung ke channel Discord Anda.
*   **Auto Restart:** Dilengkapi skrip pemantau agar bot berjalan 24/7 tanpa henti.

---

## Persiapan & Konfigurasi

1.  **Clone Repositori:**
    ```bash
    git clone https://github.com/NamekianPiccolo/bot.git
    cd bot
    ```

2.  **Buat File Konfigurasi `.env`:**
    Buat file bernama `.env` di dalam folder root project dan masukkan konfigurasi berikut:
    ```env
    # Data Login BSI
    NIM_BSI=1220xxxx
    PASS_BSI=password_anda

    # Konfigurasi Discord
    DISCORD_TOKEN=MTA5ODc2NTQzMjEwOTg3NjU0.xxxxx
    CHANNEL_ID=109876543210987654

    # Konfigurasi Tambahan (Opsional)
    HEADLESS=true
    ```

---

## Cara Menjalankan secara Lokal

1.  **Instal Dependensi:**
    ```bash
    npm install
    ```

2.  **Jalankan Bot dengan Auto-Restart:**
    ```bash
    npm start
    ```
    *Perintah ini akan menjalankan bot melalui `runner.js` yang secara otomatis akan menghidupkan kembali bot jika mendadak mati/crash.*

3.  **Jalankan Bot Tanpa Auto-Restart (Raw):**
    ```bash
    npm run start-raw
    ```

---

## Cara Menjalankan di VPS (Linux / Ubuntu)

Agar bot Anda terus berjalan di VPS meskipun Anda menutup terminal (SSH), gunakan salah satu opsi berikut:

### Opsi 1: Menggunakan PM2 (Direkomendasikan untuk Node.js)

1.  **Instal PM2 secara global:**
    ```bash
    sudo npm install -g pm2
    ```

2.  **Jalankan bot:**
    ```bash
    pm2 start index.js --name "bot-absen"
    ```

3.  **Konfigurasi agar otomatis menyala saat VPS reboot:**
    ```bash
    pm2 startup
    ```
    *(Jalankan perintah tambahan yang diberikan oleh PM2 di layar)*, lalu simpan:
    ```bash
    pm2 save
    ```

4.  **Perintah Monitor:**
    *   Cek Status: `pm2 status`
    *   Lihat Log: `pm2 logs`

---

### Opsi 2: Menggunakan Docker Compose (Sangat Praktis & Bersih)

Jika VPS Anda sudah terpasang Docker dan Docker Compose, Anda bisa langsung menjalankan bot di dalam container:

1.  **Mulai Container (di background):**
    ```bash
    docker compose up -d --build
    ```

2.  **Lihat Log/Aktivitas Bot:**
    ```bash
    docker compose logs -f
    ```

3.  **Matikan Container:**
    ```bash
    docker compose down
    ```