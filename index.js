import { Client, GatewayIntentBits, Partials, Events } from 'discord.js';
import puppeteer from 'puppeteer';
import axios from 'axios';
import dotenv from 'dotenv';
import fs, { stat } from 'fs';
import { log } from 'console';
// Load environment variables
dotenv.config();
// hubungin ke discornya 
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});
// Ganti dengan Token Bot Anda di file .env
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID; // Ambil dari .env agar lebih aman
async function NotifAbsen(urlHalaman) {
    // buka browser
    const browser = await
        puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']

        });
    // hubungin ke channel nya
    const channel = await client.channels.fetch(CHANNEL_ID);
    const page = await browser.newPage();
    // ketik url dari tab tersebut
    await page.goto("https://elearning.bsi.ac.id/login");
    // pilih username
    await page.waitForSelector('input[name="username"]');
    // isi nim nya
    await page.type('input[name="username"]', process.env.NIM_BSI);
    await page.waitForSelector('input[name="password"]');
    await page.type('input[name="password"]', process.env.PASS_BSI);
    // Captcha
    const pertanyaan = await
        page.$eval('#captcha_question', (el) => el.innerText);

    // ambil Semua angka dati id captcha_question dengan cari angka di value id nya sampai valuenya abis 
    const angka = pertanyaan.match(/\d+/g);
    const hasil =
        // angka yang ditambahin tadi diubah ke int dan ditambahkan 
        parseInt(angka[0]) + parseInt(angka[1]);
    // jawab captcha_answer dan ubah hasil tadi jadi string lagi 
    await page.type('#captcha_answer', hasil.toString());
    // klik login
    await page.click('button[type="submit"]');
    // ke halaman setelah login
    await page.waitForNavigation();
    await page.goto(urlHalaman);
    // lihat doang isinya
    const jadwalKuliah = await page.content();
    //pilih semua jadwal jadwal
    await page.waitForSelector('.col-lg-4.col-md-4.col-sm-12');
    // Ambil simpan ke variabel 
    const daftarJadwal = await
        page.$$eval('.col-lg-4.col-md-4.col-sm-12', (semuaElement) => {
            return semuaElement.map(el => {
                //lihat hari ini ada kuliah apa enggak
                const header = el.querySelector('.pricing-header');
                // lihat nama Matkulnya
                const namaMtk = el.querySelector('.pricing-title')?.innerText.trim();
                // lihat jam berapa 
                const waktu = el.querySelector('.pricing-save')?.innerText.trim();
                // lihat link absennya
                const linkAbsenMtk = el.querySelector('.btn.btn-primary.btn-lg')?.href;

                // ada kuliah apa engga
                let absen = '';
                if (header && header.classList.contains('secondary')) {
                    absen = 'tidak-masuk'
                }
                else if (header && header.classList.contains('pricing-header')) {
                    absen = 'masuk'
                }
                return {
                    namaMtk: namaMtk,
                    waktu: waktu,
                    absen: absen,
                    linkAbsenMtk: linkAbsenMtk
                };

            }
            )
        });
    for (const matkul of daftarJadwal) {
        if (matkul.absen == 'masuk' && matkul.linkAbsenMtk) {
            try {
                await page.goto(matkul.linkAbsenMtk);
                // Tunggu tombol muncul (ditingkatkan ke 15 detik)
                await page.waitForSelector(".btn.btn-rounded", { timeout: 15000 })
                const statusAbsen = await page.$eval('.btn.btn-rounded', el => {
                    if (el.classList.contains('btn-danger')) return 'belum mulai'
                    else if (el.classList.contains('btn-success')) return 'mulai';
                    else if (el.classList.contains('btn-warning')) return 'sudah selesai';
                    else return '';

                });
                if (statusAbsen === 'mulai') {
                    await page.click('.btn.btn-success.btn-rounded');
                    await new Promise(r => setTimeout(r, 4000)); // Tunggu 4 detik buat refresh
                    let pesan = `Matkul ${matkul.namaMtk} Sudah Absenin`;
                    if (channel) {
                        await channel.send(pesan)
                    }
                }
                matkul.KeteranganAbsen = statusAbsen;
            } catch (error) {
                console.log("ada error");
            }
        }
        else {
            matkul.KeteranganAbsen = "belum mulai";

        }
    }
    await browser.close();
}
async function semenit() {
    await NotifAbsen("https://elearning.bsi.ac.id/sch");
    await NotifAbsen("https://elearning.bsi.ac.id/kuliah-pengganti");
    await new Promise(r => setTimeout(r, 60000));
    semenit();
}
// Event saat bot online
client.on('ready', async () => {
    const channel = await client.channels.fetch(CHANNEL_ID);
    await channel.send('menghubungkan');
    semenit();
});
client.login(DISCORD_TOKEN);


