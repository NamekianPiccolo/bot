import { Client, GatewayIntentBits, Events } from 'discord.js';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const linkLogin = "https://elearning.bsi.ac.id/login";

let browser, page, channel;

async function serverDc() {
    try {
        channel = await client.channels.fetch(CHANNEL_ID);
    } catch (error) {
        console.log("Discord error:", error.message);
    }
}

async function Auth() {
    browser = await puppeteer.launch({
        headless: process.env.HEADLESS === 'false' ? false : "new",
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-zygote'
        ]
    });
    page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    await page.setDefaultNavigationTimeout(60000);

    await serverDc();
    await page.goto(linkLogin, { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('input[name="username"]');
    await page.type('input[name="username"]', process.env.NIM_BSI);
    await page.type('input[name="password"]', process.env.PASS_BSI);

    const pertanyaan = await page.$eval('#captcha_question', (el) => el.innerText);
    const angka = pertanyaan.match(/\d+/g);
    if (!angka || angka.length < 2) throw new Error("Captcha gagal dibaca");
    
    const hasil = parseInt(angka[0]) + parseInt(angka[1]);
    await page.type('#captcha_answer', hasil.toString());

    await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
        page.click('button[type="submit"]')
    ]);

    const isLoggedIn = await page.evaluate(() => document.body.innerText.toLowerCase().includes('logout') || document.body.innerText.toLowerCase().includes('dashboard'));
    if (!isLoggedIn) throw new Error("Login gagal, cek NIM/PASS/Captcha");
    
    console.log("[+] Login Berhasil");
}

async function ambilDataJadwal() {
    return await page.$$eval('.col-lg-4.col-md-4.col-sm-12', (elements) => {
        return elements.map(el => {
            const header = el.querySelector('.pricing-header');
            const namaMtk = el.querySelector('.pricing-title')?.innerText.trim();
            const waktu = el.querySelector('.pricing-save')?.innerText.trim();
            const linkAbsenMtk = el.querySelector('.btn.btn-primary.btn-lg')?.href;
            let absen = (header && header.classList.contains('secondary')) ? 'tidak-masuk' : 'masuk';
            return { namaMtk, waktu, absen, linkAbsenMtk };
        });
    });
}

async function prosesCek(url, sesi) {
    try {
        console.log(`[+] Mengecek ${sesi}...`);
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.col-lg-4.col-md-4.col-sm-12', { timeout: 15000 });
        
        const daftarJadwal = await ambilDataJadwal();
        for (const matkul of daftarJadwal) {
            if (matkul.absen === 'masuk' && matkul.linkAbsenMtk) {
                await page.goto(matkul.linkAbsenMtk, { waitUntil: 'domcontentloaded' });
                
                let tombolAda = true;
                try {
                    await page.waitForSelector(".btn.btn-rounded", { timeout: 10000 });
                } catch {
                    tombolAda = false;
                }

                if (!tombolAda) continue;

                const statusText = await page.$eval('.btn.btn-rounded', el => el.innerText.toLowerCase());
                if (statusText.includes('mulai')) {
                    const isPrimary = await page.$eval('.btn.btn-rounded', el => el.classList.contains('btn-primary'));
                    if (isPrimary) {
                        if (channel) await channel.send(`Matkul ${matkul.namaMtk} sudah dibuka`);
                        await page.click('.btn.btn-rounded');
                        await new Promise(r => setTimeout(r, 5000));
                        if (channel) await channel.send(`Matkul ${matkul.namaMtk} Sudah Diabsenkan 👑`);
                        console.log(`[!] Berhasil absen: ${matkul.namaMtk}`);
                    }
                }
            }
        }
    } catch (error) {
        console.log(`[-] Skip ${sesi}: ${error.message}`);
    }
}

async function loop() {
    try {
        await Auth();
        await prosesCek("https://elearning.bsi.ac.id/sch", "Kuliah Reguler");
        await prosesCek("https://elearning.bsi.ac.id/kuliah-pengganti", "Kuliah Pengganti");
    } catch (error) {
        console.log("[-] Error loop:", error.message);
    } finally {
        if (browser) await browser.close();
        setTimeout(loop, 60000);
    }
}

client.on(Events.ClientReady, async () => {
    console.log(`[+] Bot Discord Online: ${client.user.tag}`);
    await serverDc();
    if (channel) await channel.send('Bot Attendance Aktif 🚀');
    loop();
});

client.login(DISCORD_TOKEN);
