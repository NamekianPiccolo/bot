import { Client, GatewayIntentBits, Events } from 'discord.js';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import fs from 'fs';
import { isIP } from 'net';

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
        console.log("error", error.message);
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
    await bukalink(linkLogin);

    await page.waitForSelector('input[name="username"]');

    await page.type('input[name="username"]', process.env.NIM_BSI);
    await page.type('input[name="password"]', process.env.PASS_BSI);

    const pertanyaan = await page.$eval('#captcha_question', (el) => el.innerText);
    const angka = pertanyaan.match(/\d+/g);
    const hasil = parseInt(angka[0]) + parseInt(angka[1]);
    await page.type('#captcha_answer', hasil.toString());

    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    console.log("Login Berhasil");
}

async function bukalink(url) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
}
async function ambilDataJadwal() {
    return await page.$$eval('.col-lg-4.col-md-4.col-sm-12', (semuaElement) => {
        return semuaElement.map(el => {
            const header = el.querySelector('.pricing-header');
            const namaMtk = el.querySelector('.pricing-title')?.innerText.trim();
            const waktu = el.querySelector('.pricing-save')?.innerText.trim();
            const linkAbsenMtk = el.querySelector('.btn.btn-primary.btn-lg')?.href;

            let absen = (header && header.classList.contains('secondary')) ? 'tidak-masuk' : 'masuk';
            return { namaMtk, waktu, absen, linkAbsenMtk };
        });
    });
}



async function NotifAbsen(urlHalaman,sesi) {
    try {
        await Auth();

        await bukalink(urlHalaman);
        
        await page.waitForSelector('.col-lg-4.col-md-4.col-sm-12', { timeout: 30000 });

        const daftarJadwal = await ambilDataJadwal();
        console.log(`Berhasil mengambil data daftar Jadwal ${sesi}`);

        for (const matkul of daftarJadwal) {
            if (matkul.absen === 'masuk' && matkul.linkAbsenMtk) {
                try {
                   
                    await bukalink(matkul.linkAbsenMtk);
                    
                    let tanda = true;
                    try {
                        await page.waitForSelector(".btn.btn-rounded", { timeout: 20000 });
                    } catch {
                       tanda = false;
                    }

                    if(!tanda){
                        console.log(`[!] Tombol absen tidak ada untuk ${matkul.namaMtk}, skip.`);
                        continue;
                    }

                    const statusAbsen = await page.$eval('.btn.btn-rounded', el => {
                        const teks = el.innerText.toLowerCase().trim();
                        if (teks.includes('mulai')) return 'mulai';
                        if (teks.includes('belum mulai')) return 'belum mulai';
                        if (teks.includes('sudah selesai')) return 'sudah selesai';
                        return 'tidak diketahui';
                    });
                    
                   

                    if (statusAbsen === 'mulai') {
                        const cekbtn = await page.waitForSelector('.btn.btn-rounded');
                        const isPrimary = await cekbtn.evaluate(el => el.classList.contains('btn-primary'));
                        if (isPrimary){
                            console.log(`klik ABSEN pada matkul ${matkul.namaMtk}`);
                            await page.click('.btn.btn-rounded');
                            await new Promise(r => setTimeout(r, 4000));
                        if (channel) await channel.send(`Matkul ${matkul.namaMtk} Sudah Absenin King 👑`);
                        }
                        
                        
                    }
                } catch (error) {
                    console.log(`    error  matkul di ${matkul.namaMtk}: ${error.message}`);
                }
            }
        }
    } catch (globalError) {
        console.log(`Error di ${urlHalaman}: ${globalError.message}`);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
// async function tugas(urlHalaman) {
//     const fileName = 'dataTugas.json';
//     if (!fs.existsSync(fileName)) {
//         fs.writeFileSync(fileName, JSON.stringify([], null, 2));
//         console.log(`[+] File ${fileName} berhasil dibuat.`);
//     }

//     try {
//         await Auth();
//         await bukalink(urlHalaman);
//         console.log(`Memproses halaman tugas: ${urlHalaman}`);
//         // Logika scraping tugas bisa ditambahkan di sini nanti
//         const daftarJadwal = await ambilDataJadwal();
//         // let pesan = '';
//         // daftarJadwal.forEach( m => {
//         //     pesan += `\n ${m.namaMtk}`;
//         // })
//         // channel.send(pesan);
//         for(const matkul of daftarJadwal ){
//             if(matkul.linkAbsenMtk){
//                 console.log(`membuka link ${matkul.linkAbsenMtk}`)
//                 bukalink(matkul.linkAbsenMtk);
//             }
//         }


//     } catch (error) {
//         console.log(`[!] Error Tugas: ${error.message}`);
//     } finally {
//         if (browser) await browser.close();
//     }
// }

async function semenit() {
    await NotifAbsen("https://elearning.bsi.ac.id/sch",'kuliah');
    await NotifAbsen("https://elearning.bsi.ac.id/kuliah-pengganti",'kuliah pengganti');
    // await tugas("https://elearning.bsi.ac.id/sch");
    setTimeout(semenit, 60000);
}

client.on(Events.ClientReady, async () => {
    await serverDc();
    if (channel) await channel.send('menghubungkan');
    semenit();
});

client.login(DISCORD_TOKEN);
