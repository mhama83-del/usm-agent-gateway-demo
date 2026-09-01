# USM Agent Gateway

## Dokumen Spesifikasi Pembangunan dan Handoff untuk Claude Code

| Perkara | Butiran |
|---|---|
| Versi | 1.0 |
| Tarikh | 1 September 2026 |
| Status | Bersedia untuk pembangunan bersyarat |
| Sasaran pelaksana | Claude Code atau pasukan pembangunan yang dilantik |
| Nama sistem | Sistem Pengurusan Ejen Pengambilan Pelajar Antarabangsa USM |
| Nilai skop pembangunan | RM35,000.00 |
| Bentuk sistem | Aplikasi web responsif untuk portal ejen dan operasi dalaman |

> Tujuan dokumen ini adalah memberi Claude pemahaman lengkap tentang sistem yang hendak dibina: tujuan, pengguna, modul, aliran kerja, data, kualiti, keselamatan dan sempadan kerja. Ini ialah spesifikasi pembangunan, bukan sekadar reka bentuk dashboard atau quotation.

---

## 1. Arahan utama kepada Claude

Bangunkan aplikasi web bernama USM Agent Gateway untuk mengurus keseluruhan kitar hayat ejen pengambilan pelajar antarabangsa USM:

1. pendaftaran dan akaun ejen;
2. permohonan ejen baharu serta pembaharuan;
3. semakan dokumen oleh USAINS;
4. kelulusan oleh USM LEAP;
5. penjanaan dan penjejakan perjanjian;
6. rujukan pelajar oleh ejen;
7. tuntutan komisen, keputusan tuntutan dan rekod bayaran manual;
8. semakan tahunan, pembaharuan dan penamatan;
9. dashboard, SLA, notifikasi, laporan dan audit trail.

Sistem ini perlu menggantikan proses yang bergantung pada borang kertas, e-mel, fail berasingan dan susulan manual. Ia perlu menjadi satu rekod rasmi yang boleh dilihat mengikut kuasa pengguna, menunjukkan status semasa, pemilik tindakan, dokumen, tarikh akhir SLA dan sejarah tindakan.

### 1.1 Peraturan kerja Claude

1. Baca dokumen ini sepenuhnya sebelum menghasilkan kod atau mengubah repositori.
2. Mulakan dengan pra-pemeriksaan repositori: laporkan teknologi sedia ada, struktur folder, cara run dan test, risiko serta pelan kerja modul demi modul.
3. Jika repositori belum diberi atau kosong, minta Hafiz menetapkan lokasi repositori sebelum melakukan scaffolding. Jangan andaikan domain, hosting, kredensial atau lokasi pelayan.
4. Bangunkan mengikut pakej kerja dalam Seksyen 18. Selepas setiap pakej, jalankan ujian dan laporkan fail berubah, ujian yang dijalankan, keputusan dan baki risiko.
5. Jangan deploy ke staging atau production, jangan menghantar e-mel sebenar, jangan menggunakan data sebenar dan jangan menyimpan rahsia dalam repositori.
6. Jangan membina API, SSO, integrasi sistem universiti, integrasi kewangan, payment gateway, vendor e-signature atau kerja penyelarasan antara organisasi dalam fasa ini.
7. Jika dasar pelanggan belum dimuktamadkan, bina sebagai tetapan boleh konfigurasi dengan nilai seed bertanda DRAF. Jangan hard-code dasar itu.
8. Semua keputusan dan perubahan status penting mesti direkod dalam audit trail. Jangan wujudkan perubahan senyap.

### 1.2 Status kesediaan

Dokumen ini membolehkan pembangunan aplikasi dimulakan selepas pra-pemeriksaan Claude. Nilai berikut belum dimuktamadkan oleh pemilik sistem, tetapi tidak menghalang pembangunan kerana modul konfigurasi perlu menyokongnya:

- SLA sebenar mengikut proses kerja;
- kadar komisen dan formula pengiraan muktamad;
- dokumen perjanjian dan klausa undang-undang muktamad;
- pengguna awal dan kaedah pengaktifan akaun;
- SMTP, domain, hosting, sandaran dan operasi infrastruktur;
- tempoh simpanan rekod dan polisi privasi institusi.

---

## 2. Sumber rujukan dan keutamaan keputusan

Claude perlu menggunakan sumber berikut sebagai asas kefahaman. Jika ada percanggahan, gunakan urutan berikut: keputusan disahkan dalam Seksyen 3, dokumen ini, kemudian bahan rujukan asal.

| Sumber | Peranan dalam spesifikasi | Status penggunaan |
|---|---|---|
| USM Agent Gateway Leadership Pitch PDF | Menjelaskan masalah, visi kepimpinan, peranan utama dan lima peringkat kitar hayat. | Telah dirumuskan di sini. |
| Skop pembinaan dashboard rujukan ZIP | Rujukan aliran skrin, borang, konsol semakan, tuntutan, pembaharuan dan laporan. | Telah dirumuskan serta diperhalusi di sini. |
| Quotation draft USM Agent Gateway RM35,000 | Menetapkan sempadan skop, nilai RM35,000, anggaran sehingga 14 minggu dan waranti pepijat 90 hari. | Selaras dengan dokumen ini. |
| Keputusan Hafiz dalam perbualan projek | Mengeluarkan API, integrasi dan kerja koordinasi organisasi daripada fasa ini. | Muktamad untuk fasa ini. |

---

## 3. Keputusan muktamad projek

| ID | Keputusan | Status |
|---|---|---|
| D-006 | Sistem ialah platform pengurusan kitar hayat ejen, bukan dashboard semata-mata. | Disahkan |
| D-012 | Nilai sasaran skop pembangunan ialah RM35,000.00. | Disahkan |
| D-013 | Kerja koordinasi antara USAINS, USM LEAP, PPKT atau Finance serta integrasi API tidak termasuk dalam skop ini. | Disahkan |
| D-014 | Fasa ini tidak merangkumi API, SSO, integrasi sistem pelajar atau kewangan, payment gateway, atau vendor e-signature. Data daripada sistem lain direkod manual oleh pegawai berkuasa dengan audit trail. | Disahkan |
| D-015 | Sistem perlu dibina secara production-minded: RBAC, perlindungan dokumen, SLA, audit, laporan, ujian dan dokumentasi adalah keperluan teras. | Disahkan |

---

## 4. Masalah perniagaan, objektif dan prinsip

### 4.1 Masalah semasa

Proses pengurusan ejen dan komisen berlaku melalui borang kertas, e-mel, fail berasingan dan susulan manual. Kesan utamanya:

- status permohonan tidak dikongsi secara jelas;
- dokumen sukar dicari dan sukar dibuktikan telah disemak;
- SLA, tarikh tamat perjanjian dan semakan tahunan boleh terlepas;
- ejen tidak tahu tindakan seterusnya atau sebab sesuatu kes ditangguhkan;
- pengurusan tidak mempunyai paparan tepat untuk backlog, performance dan risiko;
- keputusan dan bayaran sukar diaudit dari satu sumber.

### 4.2 Hasil sistem

Sistem siap mesti membolehkan:

- ejen menghantar dan menjejaki permohonan tanpa bergantung kepada pertanyaan e-mel;
- USAINS menyemak dokumen, meminta pembetulan dan menghantar kes lengkap kepada USM LEAP;
- USM LEAP meluluskan, menolak, memutuskan tuntutan dan menjalankan pembaharuan dengan alasan direkod;
- status perjanjian tiga pihak ditjejak dan salinan signed copy disimpan secara terkawal;
- rujukan pelajar dan komisen dijejak sehingga bayaran dicatat;
- pengurusan memantau tindakan tertunggak, SLA, ejen hampir tamat dan prestasi;
- setiap tindakan penting boleh diaudit mengikut siapa, bila, apa yang berubah dan sebabnya.

### 4.3 Prinsip reka bentuk

1. Satu sumber rekod rasmi, bukan status tersembunyi dalam e-mel.
2. Manual tetapi terkawal: tiada integrasi dalam fasa ini, maka kemas kini manual dibenarkan hanya kepada peranan berkuasa dan mesti diaudit.
3. Konfigurasi mengatasi hard-code: SLA, checklist dokumen, kadar komisen, ambang pembaharuan, yuran dan amaran diurus melalui tetapan.
4. Akses minimum diperlukan: ejen hanya melihat organisasinya sendiri.
5. Audit trail ialah ciri teras, bukan tambahan di akhir projek.
6. Setiap skrin kes perlu menunjukkan status semasa, tindakan seterusnya, pemilik tindakan dan tarikh akhir jika relevan.

---

## 5. Sempadan skop

### 5.1 Termasuk dalam skop RM35,000

| Domain | Keupayaan termasuk |
|---|---|
| Asas platform | Log masuk, set semula kata laluan, pengguna, peranan/keizinan, profil organisasi, notifikasi dalam sistem, SMTP pelanggan, audit log dan konfigurasi. |
| Permohonan ejen | Borang baharu/pembaharuan, wizard, muat naik dokumen, deklarasi ABC, semakan dan pembetulan. |
| Kelulusan | Konsol USAINS, konsol USM LEAP, aturan status, alasan keputusan, SLA dan aktiviti kes. |
| Perjanjian | Jana draf dari templat, rekod status tiga pihak dan simpan signed copy yang dimuat naik secara manual. |
| Rujukan pelajar | Ejen merekod rujukan; pegawai dalaman mengemas kini status secara manual dengan sejarah. |
| Komisen | Tuntutan, checklist kelayakan, bukti, semakan, keputusan, snapshot kadar komisen dan rekod bayaran manual. |
| Pembaharuan | Ejen hampir tamat, annual review, semakan prestasi dan keputusan renew atau terminate. |
| Pelaporan | Dashboard peranan, penapis, eksport CSV dan PDF atau printable PDF. |
| Kualiti | Database migrations, seed data rekaan, ujian automatik teras, panduan pemasangan, UAT dan operasi. |

### 5.2 Tidak termasuk dalam skop ini

| Item dikecualikan | Ketetapan |
|---|---|
| API, webhook atau integrasi sistem lain | Tidak dibina. Tiada sambungan ke sistem pelajar, kewangan, CRM, SSO atau portal USM. |
| Single Sign-On | Tidak dibina. Sistem menggunakan autentikasi tempatan. |
| Payment gateway atau pembayaran automatik | Tidak dibina. Pembayaran direkod manual oleh pegawai berkeizinan bersama rujukan transaksi. |
| E-signature vendor atau pengesahan undang-undang tandatangan digital | Tidak dibina. Sistem hanya menjejak status pihak tandatangan dan menyimpan dokumen bukti. |
| Koordinasi SOP antara unit | Tidak termasuk. Pelanggan menentukan SOP, pemilik proses dan aliran kelulusan sebenar. |
| Migrasi data lama berskala besar | Tidak termasuk kecuali dipersetujui sebagai skop tambahan. |
| Hosting, domain, SSL, SMTP sebenar, antivirus dokumen dan sandaran pelayan | Pelanggan menyediakan. Pembangun menyediakan keperluan konfigurasi dan panduan sahaja. |
| Aplikasi mobile native | Tidak termasuk. Antara muka web mesti responsif. |

---

## 6. Pengguna, peranan dan kawalan akses

Gunakan role-based access control dengan permission granular. Super Admin memberi peranan kepada pengguna. Konflik kuasa seperti pihak yang membuat keputusan tuntutan dan merekod bayaran perlu dielakkan secara default.

| Peranan | Tujuan | Akses utama | Larangan utama |
|---|---|---|---|
| Super Admin | Pentadbir teknikal sistem. | Urus pengguna, peranan, tetapan, templat, SLA, kadar komisen, checklist, laporan dan audit. | Tidak sepatutnya membuat keputusan kelulusan atau bayaran bagi kes sendiri. |
| Agent Organisation Admin | Wakil utama syarikat ejen. | Urus profil syarikat, pengguna organisasi, permohonan, dokumen, rujukan, tuntutan dan perjanjian organisasi sendiri. | Tidak melihat organisasi lain atau konsol dalaman. |
| Agent Organisation User | Pengguna biasa syarikat ejen. | Menyedia dan melihat rekod organisasi sendiri mengikut permission diberi. | Tiada akses tetapan organisasi atau data ejen lain. |
| USAINS Verification Officer | Pegawai semakan permohonan/dokumen. | Queue, semak dokumen, return untuk pembetulan, tambah nota dan forward ke LEAP. | Tidak meluluskan akhir permohonan atau claim sendiri. |
| USAINS Claim and Payment Officer | Pegawai proses claim dan rekod bayaran. | Semak claim, return, forward keputusan dan rekod bayaran manual. | Tidak membuat keputusan akhir claim jika peranan LEAP diasingkan. |
| USM LEAP Approver | Pegawai atau panel pelulus. | Lulus/tolak permohonan, putuskan claim, annual review, renew/terminate dan laporan dibenarkan. | Tidak memadam audit atau mengubah dokumen asal tanpa sejarah. |
| Management or Auditor | Pemantauan sahaja. | Dashboard, laporan, rekod dan audit read-only mengikut polisi. | Tiada penciptaan atau keputusan workflow. |

### 6.1 Peraturan akses wajib

- Semua rekod portal ejen mesti ditapis dengan organisation ID pengguna semasa, bukan disembunyikan daripada menu sahaja.
- Pautan terus ke nombor atau ID rekod juga mesti melepasi permission dan tenant check.
- USAINS dan USM LEAP hanya menjalankan tindakan workflow yang diberi kepada peranan mereka.
- Pengguna dinyahaktif tidak boleh log masuk; rekod sejarahnya kekal.
- Hanya Super Admin boleh mengubah polisi. Perubahan konfigurasi penting mesti diaudit.
- Pegawai keputusan claim dan pegawai rekod bayaran perlu mempunyai permission berasingan sebagai default.

---

## 7. Kitar hayat dan status operasi

Paparan kepimpinan perlu menunjukkan lima peringkat ringkas:

| Peringkat kepimpinan | Pemetaan operasi |
|---|---|
| Submitted | Draft dan submitted application |
| Verified by USAINS | Under USAINS review dan verified |
| Approved and Signed | Under LEAP review, approved awaiting agreement dan agreement signed |
| Active | Agent active |
| Annual Review | Review due, renewed, not renewed atau terminated |

Aliran kerja: Permohonan ejen ke semakan USAINS. Jika tidak lengkap, ia dipulangkan kepada ejen. Jika lengkap, USAINS forward kepada USM LEAP. Kelulusan menghasilkan draf perjanjian. Selepas semua pihak perjanjian lengkap, ejen menjadi aktif. Ejen aktif boleh merujuk pelajar dan menghantar tuntutan. Sebelum tamat, ejen melalui annual review untuk renew atau tamat.

### 7.1 Status permohonan

| Status | Maksud | Pemilik tindakan seterusnya |
|---|---|---|
| DRAFT | Borang belum dihantar. | Ejen |
| SUBMITTED | Ejen menghantar permohonan untuk semakan. | USAINS |
| UNDER_USAINS_REVIEW | USAINS sedang menyemak butiran dan dokumen. | USAINS |
| RETURNED_TO_AGENT | Pembetulan atau dokumen tambahan diperlukan; sebab wajib. | Ejen |
| VERIFIED | USAINS telah mengesahkan dan menghantar kes. | USM LEAP |
| UNDER_LEAP_REVIEW | Menunggu atau sedang dalam keputusan LEAP. | USM LEAP |
| APPROVED_AWAITING_AGREEMENT | Diluluskan tetapi perjanjian belum lengkap. | USAINS, LEAP dan Ejen |
| REJECTED | Permohonan ditolak; sebab wajib. | Tamat |
| WITHDRAWN | Ejen menarik balik permohonan. | Tamat |
| CANCELLED | Pentadbir membatalkan dengan alasan. | Tamat |

### 7.2 Status perjanjian dan ejen

| Domain | Status minimum | Catatan |
|---|---|---|
| Perjanjian | NOT_GENERATED, DRAFT, AWAITING_USAINS_SIGNATURE, AWAITING_LEAP_SIGNATURE, AWAITING_AGENT_SIGNATURE, FULLY_SIGNED, VOID, EXPIRED | Urutan tandatangan boleh ditetapkan. Ini bukan e-signature vendor. |
| Kitar hayat ejen | PENDING, ACTIVE, SUSPENDED, REVIEW_DUE, RENEWED, NOT_RENEWED, TERMINATED, EXPIRED | Ejen menjadi ACTIVE hanya selepas permohonan lulus dan agreement FULLY_SIGNED. |

### 7.3 Status rujukan dan claim

| Domain | Status minimum | Pemilik kemas kini |
|---|---|---|
| Rujukan pelajar | SUBMITTED, OFFERED, ENROLLED, FEES_PAID, WITHDRAWN, NOT_PROCEED | Ejen mencipta; pegawai berautoriti mengesahkan status secara manual. |
| Tuntutan komisen | DRAFT, SUBMITTED, UNDER_USAINS_REVIEW, RETURNED, PENDING_LEAP_DECISION, APPROVED_PENDING_PAYMENT, REJECTED, PAID, CANCELLED | Ejen submit, USAINS semak, LEAP putuskan, Payment Officer rekod bayaran. |

### 7.4 Peraturan transisi status

- Semua transisi status mesti melalui workflow service, bukan update biasa dalam controller.
- Return, reject, cancel, suspend, not renew dan terminate memerlukan alasan teks.
- Setiap transisi menyimpan pengguna, timestamp, status lama, status baharu dan nota.
- Permohonan approved tidak boleh diubah bebas oleh ejen; perubahan material memerlukan pembetulan/versi baharu yang direkod.
- Claim hanya boleh PAID selepas APPROVED_PENDING_PAYMENT dan payment reference manual direkod.
- Rujukan dan claim yang telah dihantar tidak dipadam fizikal melalui UI.

---

## 8. Modul fungsi terperinci

### 8.1 Modul A: Akaun, autentikasi dan organisasi

Tujuan modul ini ialah akses yang selamat dan pengasingan data setiap syarikat ejen.

Fungsi:

- log masuk dengan e-mel dan kata laluan;
- lupa kata laluan, reset link satu kali dan tempoh luput;
- pengesahan e-mel jika pendaftaran terbuka digunakan;
- Super Admin mencipta, menjemput, menyahaktif atau reset pengguna;
- pengguna ejen dikaitkan kepada satu organisasi; satu organisasi boleh mempunyai beberapa pengguna;
- Agent Organisation Admin mengurus profil syarikat dan pengguna organisasinya mengikut permission;
- log login asas dan percubaan gagal untuk pentadbir;
- audit perubahan peranan, status pengguna dan organisasi.

Sediakan setting agent registration mode dengan dua nilai: self registration atau admin invitation. Seed awal menggunakan admin invitation supaya akses lebih terkawal; pemilik sistem boleh mengubahnya pada UAT.

### 8.2 Modul B: Permohonan ejen baharu dan pembaharuan

Tujuan modul ini ialah menggantikan borang manual dengan wizard yang boleh disimpan sebagai draf dan disemak semula.

Jenis permohonan:

- NEW: ejen baharu;
- RENEWAL: pembaharuan ejen sedia ada atau annual review yang menghasilkan tempoh baharu.

| Seksyen | Medan minimum |
|---|---|
| Butiran syarikat | Nama syarikat, nombor pendaftaran SSM atau setara luar negara, tax ID/TIN, paid-up capital, negara, alamat berdaftar, alamat operasi, laman web, e-mel rasmi dan telefon. |
| PIC dan pengarah | Nama PIC, jawatan, e-mel, telefon; senarai pengarah dengan nama serta nombor ID atau pasport yang dilindungi. |
| Maklumat permohonan | Jenis, tarikh dihantar, organisasi sedia ada bagi renewal dan catatan ejen. |
| Prestasi renewal | Bilangan rujukan tahun terdahulu, kehadiran annual briefing, sejarah blacklist sejak semakan terakhir dan penjelasan jika perlu. |
| Pengesahan | Pengakuan ketepatan maklumat, nama penuh pengesah, tarikh dan persetujuan deklarasi ABC. |

Dokumen perlu dikawal oleh template checklist konfigurasi:

| Kod cadangan | Dokumen | Keperluan asal |
|---|---|---|
| COMPANY_REGISTRATION | Sijil pendaftaran syarikat, SSM atau setara luar negara. | Wajib |
| CAPITAL_EVIDENCE | Bukti paid-up capital minimum. | Wajib; nilai minimum konfigurasi. |
| AUDITED_FINANCIALS | Penyata kewangan beraudit dua tahun terkini. | Wajib atau konfigurasi. |
| OPERATING_EXPERIENCE | Bukti pengalaman operasi minimum dua tahun. | Wajib atau konfigurasi. |
| FULL_TIME_STAFF | Bukti minimum dua staf sepenuh masa dan resume. | Wajib atau konfigurasi. |
| BUSINESS_PLAN | Strategi atau pelan perniagaan. | Wajib |
| DIRECTOR_RESUME | Resume pengarah. | Wajib |
| REGISTRATION_FEE_PROOF | Bukti bayaran yuran pendaftaran. | Seed DRAF: NEW RM2,000, RENEWAL RM1,000. |
| PERFORMANCE_BOND_PROOF | Bukti bayaran performance bond. | Seed DRAF: RM500. |

Keperluan UX:

- progress indicator;
- save draft;
- validasi setiap langkah dan validasi keseluruhan pada submit;
- summary sebelum submit;
- status setiap dokumen;
- alasan pembetulan yang jelas;
- status trail dan activity log pada detail kes.

### 8.3 Modul C: Deklarasi Anti-Bribery and Corruption

Deklarasi ABC ialah sebahagian daripada permohonan. Sistem menyimpan snapshot jawapan setelah submit. Soalan minimum:

1. Adakah syarikat atau pengarah pernah diblacklist atau disiasat berkaitan rasuah?
2. Adakah organisasi mempunyai polisi ABC dalaman?
3. Pengesahan bahawa tiada gratification diberi atau diterima untuk mendapatkan urusan.
4. Persetujuan melaporkan percubaan rasuah.
5. Nama penuh sebagai tandatangan pengesahan dan tarikh.
6. Ruang upload cop syarikat jika diwajibkan oleh setting.

Jawapan dan dokumen deklarasi tidak boleh ditimpa tanpa menyimpan versi atau snapshot lama selepas permohonan dihantar.

### 8.4 Modul D: Konsol semakan USAINS

Fungsi:

- queue SUBMITTED dan UNDER_USAINS_REVIEW, diisih dengan kes SLA overdue terlebih dahulu;
- filter negara, jenis permohonan, status, tarikh submit, SLA dan pegawai;
- detail kes menunjukkan profil syarikat, PIC/pengarah, deklarasi, dokumen, checklist, status trail, activity log dan SLA;
- setiap dokumen boleh ditanda PENDING, VERIFIED, REJECTED atau NOT_APPLICABLE;
- penolakan dokumen memerlukan nota;
- return for correction perlu memilih satu atau lebih item dan memasukkan alasan jelas;
- verify and forward hanya dibenarkan apabila semua dokumen wajib VERIFIED atau NOT_APPLICABLE dengan sebab;
- nota ringkasan semakan USAINS dipaparkan kepada LEAP;
- masa mula dan selesai semakan direkod.

### 8.5 Modul E: Konsol kelulusan USM LEAP

Fungsi:

- queue VERIFIED dan UNDER_LEAP_REVIEW dengan filter negara, jenis, status, SLA, tarikh dan risk flag;
- paparan data yang telah diverifikasi bersama checklist, nota, dokumen dan prestasi renewal;
- tindakan Approve, Reject dan Return to USAINS jika polisi memerlukannya;
- alasan wajib bagi reject dan return;
- approval menukar status kepada APPROVED_AWAITING_AGREEMENT dan mencipta rekod agreement draf;
- paparan ejen aktif mengikut negara, status, expiry date, SLA, hampir tamat dan flag performance;
- annual review dan keputusan renew, not renew, suspend atau terminate mengikut permission.

### 8.6 Modul F: Perjanjian dan rekod tandatangan

Tujuan: perjanjian boleh dijejak tanpa mendakwa mempunyai e-signature yang sah dari segi undang-undang.

Fungsi:

- template agreement berversi, aktif dan ditadbir Super Admin;
- jana draf daripada data organisasi dan application yang diluluskan;
- snapshot isi agreement ketika dijana supaya perubahan template masa depan tidak mengubah rekod lama;
- pihak minimum: USAINS, USM LEAP dan Ejen;
- setiap pihak mempunyai status pending, confirmed/signed atau rejected, bersama nama, tarikh, catatan dan dokumen bukti jika ada;
- agreement status dikira daripada status tandatangan;
- ejen hanya active apabila agreement FULLY_SIGNED;
- signed copy disimpan private dan boleh dimuat turun mengikut permission.

Nilai rujukan dalam bahan asal ialah UG 15 peratus daripada yuran tahun pertama, PG 10 peratus daripada yuran tahun pertama, dan bayaran dalam 30 hari selepas claim approved. Semua nilai itu perlu menjadi parameter atau rate schedule, bukan hard-code.

### 8.7 Modul G: Rujukan pelajar

Fungsi:

- ejen ACTIVE mencipta rujukan dengan minimum nama penuh, nombor pasport/ID yang dilindungi, e-mel atau telefon jika diputuskan, negara, programme/school applied, tarikh rujukan dan catatan;
- sistem membuat duplicate check menggunakan identifier hash dan tempoh konfigurasi; ia memberi amaran tanpa mendedahkan ejen lain;
- ejen melihat rujukan organisasinya sendiri dan status history;
- pegawai dalaman berautoriti mengemas kini OFFERED, ENROLLED, FEES_PAID, WITHDRAWN atau NOT_PROCEED secara manual berdasarkan sumber dalaman yang disahkan;
- setiap perubahan status memerlukan tarikh efektif, pengguna, catatan dan sumber pengesahan ringkas;
- pencarian, penapis status, programme, negara, ejen dan tarikh;
- export mengikut permission.

Tiada semakan kemasukan, yuran atau status pelajar secara automatik kerana integration tidak termasuk.

### 8.8 Modul H: Tuntutan komisen dan bayaran

Tujuan: mengawal claim dengan syarat kelayakan, bukti dan pemisahan keputusan daripada rekod bayaran.

Syarat kelayakan minimum yang perlu disemak secara manual oleh pegawai:

1. Pelajar direkrut atau dirujuk oleh ejen penuntut.
2. Pelajar telah ENROLLED.
3. Yuran pengajian telah dibayar penuh dan disahkan sebagai FEES_PAID.
4. Pelajar telah melengkapkan minimum dua bulan pengajian.
5. Tiada full refund yang membatalkan kelayakan.

Fungsi:

- ejen membina DRAFT claim, memilih satu atau lebih rujukan yang layak dan melampirkan invois atau bukti;
- sistem menyimpan snapshot rate schedule, asas kiraan dan amount pada masa claim dihantar;
- USAINS Claim Officer menyemak kelayakan/bukti, return dengan alasan atau forward untuk LEAP decision;
- USM LEAP Approver approve atau reject dengan alasan;
- Payment Officer merekod pembayaran manual selepas approval: tarikh, amaun, transaction reference, penerima, nota dan bukti;
- sistem tidak menjalankan transaksi kewangan;
- ejen boleh melihat status dan alasan return/rejection, tetapi bukan nota dalaman sensitif;
- setiap claim mempunyai nombor rujukan unik.

Sediakan commission rate schedule sekurang-kurangnya bagi level pengajian UG/PG, kadar peratus atau formula, tarikh efektif, tarikh tamat pilihan, status aktif, versi dan nota. Seed DRAF boleh menggunakan UG 15 peratus dan PG 10 peratus; sahkan pada UAT.

### 8.9 Modul I: Annual review dan pembaharuan

Fungsi:

- queue ejen tamat dalam 90, 60 dan 30 hari; ambang hari konfigurasi;
- cipta annual review bagi ejen due;
- paparkan tarikh agreement, tarikh tamat, rujukan tempoh semakan, ringkasan claim, isu blacklist dan pematuhan annual briefing;
- semak ambang prestasi; seed DRAF minimum 15 referrals dan perlu dikonfigurasi;
- keputusan RENEW, NOT_RENEW, SUSPEND atau TERMINATE dengan alasan;
- renew menghasilkan renewal application atau agreement baharu mengikut polisi konfigurasi;
- terminate mengekalkan semua sejarah dan menghalang rujukan/claim baharu kecuali ada pengecualian direkod.

### 8.10 Modul J: Dashboard, notifikasi dan laporan

Dashboard mengikut peranan:

| Pengguna | Kandungan minimum |
|---|---|
| Ejen | Status application dan agreement, dokumen perlu dibetulkan, rujukan, claim, notifikasi dan next action. |
| USAINS | Pending verification, overdue SLA, dokumen perlu tindakan, pending claim review, priority queue dan aktiviti terkini. |
| USM LEAP | Pending approval, pending claim decision, active agents, ejen hampir tamat, annual review due dan exception flags. |
| Management/Auditor | Ejen aktif, application mengikut peringkat, turnaround SLA, rujukan, claim, bayaran dan trend ringkas. |

Notifikasi minimum:

- application dihantar, dipulangkan, verified, approved atau rejected;
- dokumen rejected atau correction required;
- tugasan baharu bagi pegawai;
- SLA approaching atau overdue;
- agreement menunggu tandatangan;
- claim dihantar, dipulangkan, diluluskan, ditolak atau dibayar;
- annual review due dan agreement hampir tamat.

E-mel menggunakan SMTP pelanggan melalui queue dan cron yang boleh diperiksa dengan email log. Pada development/UAT, e-mel sebenar dimatikan atau dihantar ke mailbox ujian sahaja.

Laporan minimum dengan filter tarikh, status dan role/organization:

| Laporan | Akses |
|---|---|
| Application ejen mengikut status, negara dan tempoh | USAINS, LEAP, Management, Admin |
| Verification queue dan SLA | USAINS, LEAP, Management, Admin |
| Ejen aktif, hampir tamat, suspended/terminated dan annual review | LEAP, Management, Admin |
| Rujukan mengikut ejen, programme, negara dan status | Ejen sendiri serta pegawai berkuasa |
| Claim mengikut status, amaun, ejen, keputusan dan payment | Ejen sendiri serta USAINS, LEAP, Management, Admin |
| Audit activity satu kes atau tempoh | Admin/Auditor ikut polisi |

Semua laporan perlu ada eksport CSV dan PDF atau printable PDF dengan kawalan akses yang sama seperti UI.

---

## 9. SLA dan automasi dalaman

SLA mesti dibina sebagai enjin konfigurasi. Jangan meletakkan tarikh mati dalam kod.

Setiap polisi SLA menyokong nama, domain, status mula, status tamat, tempoh, unit hari kalendar atau hari bekerja, ambang amaran, pemilik, aktif/tidak aktif dan versi.

| Polisi | Nilai seed DRAF | Perlu disahkan UAT |
|---|---:|---|
| Semakan USAINS | 7 hari kalendar | Ya |
| Keputusan USM LEAP | 7 hari kalendar | Ya |
| Keputusan claim | 14 hari kalendar | Ya |
| Amaran tamat ejen/agreement | 90, 60, 30 hari | Ya |
| Minimum tempoh pengajian bagi claim | 2 bulan | Ya |

Keperluan:

- setiap kes relevan memaparkan Within SLA, Approaching Deadline atau Overdue bersama due date;
- queue dalaman boleh diisih dan ditapis mengikut SLA;
- sediakan scheduled CLI command atau cron untuk mengira SLA dan menjana notifikasi;
- perubahan SLA tidak memadam fakta sejarah; simpan policy/version pada SLA event jika praktikal;
- seed awal menggunakan hari kalendar. Sokongan hari bekerja boleh diaktifkan setelah polisi cuti ditetapkan.

---

## 10. Model data dan pangkalan data

Gunakan database relasi dengan foreign key, indeks pada medan carian dan queue, timestamps serta soft delete hanya bagi rekod rujukan yang sesuai. Workflow, audit, payment dan dokumen tidak boleh dipadam melalui UI.

Hubungan teras:

| Ibu | Hubungan | Anak |
|---|---|---|
| Organization | mempunyai ramai | Users |
| Organization | menghantar ramai | Applications |
| Application | mengandungi ramai | Application Documents dan Workflow Actions |
| Application | menghasilkan satu atau lebih | Agreement records |
| Organization | memiliki ramai | Referrals |
| Referral | menyokong satu atau lebih | Claim items |
| Claim | mempunyai satu atau lebih | Eligibility checks, evidence dan payment records |
| Organization | menjalani ramai | Annual reviews |
| User | melakukan ramai | Audit logs |

| Entiti | Tujuan | Medan penting minimum |
|---|---|---|
| users | Akaun pengguna. | id, name, email, password hash, status, last login, created at. |
| roles, permissions, user roles | RBAC. | code, name, permission code, mapping. |
| organizations | Syarikat ejen. | legal name, registration number, tax ID, country, contact data, lifecycle status. |
| organization users | Pautan user kepada organisasi. | organization ID, user ID, role in organization, active. |
| agent profiles | Butiran operasi ejen. | PIC, director summary, activation date, expiry date, review state. |
| applications | Permohonan baharu/renewal. | reference no, organization, type, status, submitted at, owner role, SLA due, decision fields, version. |
| application company snapshots | Snapshot syarikat semasa submit. | application ID dan data company/PIC/director snapshot. |
| application documents | Fail dan status semakan. | document type, file metadata, status, reviewer, review note, verified at. |
| document checklist templates | Dokumen konfigurasi. | code, name, applies to, mandatory, types, max size, active, version. |
| abc declarations | Snapshot deklarasi. | application, answers, signer name, declared at, stamp reference. |
| workflow actions | Sejarah tindakan kes. | subject type/ID, action, from status, to status, actor, reason, note, occurred at. |
| sla policies dan sla events | Tetapan dan rekod SLA. | policy/version, case type, start/end, due at, state, breached at. |
| agreement templates | Template berversi. | name, version, body, active, approval metadata. |
| agreements dan signatures | Draf dan status tandatangan. | application, template snapshot, status, party, signer, signed at, document reference. |
| referrals dan referral status history | Rujukan dan sejarah. | reference no, organization, encrypted identifier, identifier hash, name, programme, status, effective at. |
| commission rate schedules | Kadar komisen berversi. | study level, rate/formula, effective dates, active, version. |
| claims dan claim items | Claim dan referral berkaitan. | reference no, organization, status, amount, rate snapshot, calculation snapshot. |
| claim eligibility checks dan evidence | Bukti lima syarat. | criterion, pass/fail, verified by, verified at, note, file reference. |
| payments | Rekod bayaran manual. | claim, amount, paid at, payment reference, recorded by, proof, note. |
| annual reviews | Semakan ejen. | organization, due date, period, referral snapshot, outcome, reason, new expiry. |
| notifications dan email logs | Notifikasi dan penghantaran. | recipient, event, message, read at, target, status, attempts, sent at. |
| audit logs | Audit append-only. | actor, action, subject, before/after summary, IP, user agent, occurred at. |
| system settings | Tetapan sistem. | key, value, type, updated by, updated at. |
| report exports | Rekod eksport. | report type, filter snapshot, requester, file reference, generated and expiry dates. |

Peraturan data:

- nombor rujukan unik dan mudah dibaca, contohnya AG-2026-000001, REF-2026-000001 dan CLM-2026-000001;
- nombor pasport atau ID pelajar/pengarah disimpan encrypted jika stack membenarkan, serta hash berasingan untuk duplicate detection;
- UI memask data sensitif, contoh A12••••89;
- fail disimpan dengan nama rawak dalam storan private; nama asal dan metadata di database;
- snapshot bagi submitted application, ABC declaration, generated agreement, rate schedule claim, eligibility dan annual review;
- semua rekod penting mempunyai created at, updated at dan actor bagi perubahan;
- migrations dan seeders wajib; data seeder mesti rekaan dan jelas bukan data USM sebenar.

---

## 11. Keperluan skrin dan navigasi

Gunakan bahan HTML dalam ZIP sebagai inspirasi aliran dan hierarki maklumat. Jangan salin data rekaan atau tingkah laku prototaip secara membuta tuli. Hasil mesti kemas, mudah alih dan accessible.

| ID | Skrin | Pengguna | Keperluan utama |
|---|---|---|---|
| S-001 | Log masuk, lupa kata laluan, reset | Semua | Validasi, throttle, mesej selamat, redirect ikut role. |
| S-002 | Dashboard Ejen | Ejen | Status application/agreement, action required, referral, claim, notifikasi. |
| S-003 | Wizard application | Ejen | New/Renewal, draft, company, PIC/director, dokumen, ABC, performance, summary, submit. |
| S-004 | Detail application dan correction | Ejen | Status trail, dokumen per item, return reason, upload semula, activity log yang dibenarkan. |
| S-005 | Referral | Ejen/Pegawai | Senarai, create/detail, status history, filter dan tenant controls. |
| S-006 | Claim | Ejen/Pegawai | Draft, item, evidence, eligibility, decision, payment, status trail. |
| S-007 | Agreement tracker | Ejen/Pegawai | Draf, pihak tandatangan, status, upload/download terkawal. |
| S-008 | Dashboard dan queue USAINS | USAINS | Pending/overdue, metrik, filter, detail dan verify/return. |
| S-009 | Dashboard dan queue LEAP | LEAP | Pending approval/claim/review, detail, keputusan dan alasan. |
| S-010 | Payment queue | Payment Officer | Claim lulus, payment reference dan bukti. |
| S-011 | Annual review dan expiry monitor | LEAP/Admin | Ejen hampir tamat, performance dan renew/terminate. |
| S-012 | Pentadbiran | Super Admin | Users, roles, template dokumen, SLA, rate, agreement template, setting. |
| S-013 | Laporan dan eksport | Mengikut permission | Filter, table, CSV, printable/PDF. |
| S-014 | Aktiviti, audit dan notifikasi | Mengikut permission | Status trail, notifikasi sendiri, full audit untuk Admin/Auditor. |

Corak UI wajib:

- top bar menunjukkan pengguna, peranan aktif, notifikasi dan log keluar;
- navigasi dipaparkan mengikut permission;
- detail kes mengandungi ringkasan status, SLA chip, action panel, tab data/dokumen/history dan activity log;
- tindakan berisiko seperti approve, reject, terminate atau mark paid memerlukan confirmation dan alasan jika wajib;
- jadual mesti responsif; gunakan list card/detail view pada telefon;
- label status konsisten dan warna tidak menjadi satu-satunya pembawa maksud.

---

## 12. Cadangan seni bina teknikal

| Lapisan | Cadangan |
|---|---|
| Backend | PHP 8.2 ke atas dan CodeIgniter 4.7 ke atas. |
| Database | MySQL 8.0 ke atas atau MariaDB 10.6 ke atas. |
| UI | Server-rendered views, Bootstrap 5 dan JavaScript ringan. SPA tidak diperlukan. |
| Auth | Local authentication, Argon2id atau bcrypt, password reset token dan RBAC. |
| Fail | Private writable storage di luar web root atau disk configurable; download melalui authorization controller. |
| Jobs | CLI/cron untuk SLA, notifikasi, annual review alerts dan e-mail queue. |
| E-mail | SMTP pelanggan melalui environment variables, e-mail log dan mode development selamat. |
| Deployment | Konfigurasi staging dan production berasingan; pelayan/domain/SSL pelanggan sediakan. |
| Dokumentasi | README, env example, migration/seed guide, cron guide, UAT dan operasi asas. |

Struktur kod:

- controller untuk input, authorization dan response;
- service atau workflow layer untuk status transition, keputusan, SLA dan business rules;
- policy/filter/middleware untuk RBAC dan tenant isolation;
- model/repository untuk persistence dan query;
- validation rules untuk medan dan fail;
- migration/seeder untuk schema dan data rekaan;
- command/job untuk SLA, alert dan e-mail;
- unit test untuk business rules, feature/integration test untuk workflow dan authorization.

Elakkan status diubah dengan update generik, pengiraan komisen dalam controller, akses data sensitif dalam view, atau query organisation lain tanpa scope check.

---

## 13. Keselamatan, privasi dan kebolehkesanan

Sistem menyimpan data organisasi, dokumen syarikat, data pengarah dan pengenalan pelajar. Keperluan ini ialah syarat penerimaan.

### 13.1 Kawalan minimum

- HTTPS diwajibkan pada production.
- Password hash menggunakan Argon2id atau bcrypt. Jangan simpan kata laluan asal.
- Login throttling/rate limiting dan log percubaan gagal.
- Reset token satu kali guna dan ada expiry.
- CSRF untuk semua borang yang mengubah data.
- Server-side validation semua input dan output escaping.
- Authorization pada route, controller dan query; UI hidden bukan security.
- Perlindungan daripada IDOR melalui tenant filtering dan policy check untuk setiap resource.
- Upload validate extension, MIME type, size, random filename dan private storage.
- Tolak executable, script dan jenis fail berisiko.
- Download file melalui endpoint terkawal yang log akses dan check permission.
- Mask data pasport/ID dalam UI dan hadkan eksport ikut peranan.
- Rahsia database, SMTP dan encryption key hanya melalui environment variables; environment file dikecualikan daripada version control.
- Audit log append-only pada application layer, tanpa fungsi UI edit/delete.
- Log tidak boleh mendedahkan password, reset token, full passport/ID atau secrets.

### 13.2 Audit trail minimum

Rekod audit untuk:

- log masuk berjaya/gagal dan reset password;
- create/update/submit application;
- upload, replace, verify atau reject dokumen;
- semua status transition dan alasan;
- approve, reject, return, terminate dan renew;
- perubahan rate schedule, SLA, agreement template, permission dan user;
- create/update referral status;
- submit/review/approve/reject/pay claim;
- download fail sensitif dan report export jika praktikal.

---

## 14. Keperluan bukan fungsi

| Area | Keperluan penerimaan |
|---|---|
| Responsif | Aliran utama boleh digunakan pada lebar 360px ke atas dan desktop. |
| Prestasi | Sasaran 95 peratus halaman atau aksi biasa siap kurang daripada 3 saat pada staging dengan data ujian projek dan sekurang-kurangnya 10 pengguna serentak. |
| Konsistensi data | Gunakan database transaction bagi tindakan multi-table seperti keputusan workflow, claim/payment dan annual review. |
| Kebolehgunaan | UI bermula dalam Bahasa Melayu; istilah Inggeris teknikal kekal konsisten. |
| Aksesibiliti | Label jelas, focus state, validasi boleh dibaca, kontras munasabah dan keyboard navigation bagi aliran teras. |
| Pelayar | Dua versi terkini Chrome, Edge, Firefox dan Safari moden secara best effort. |
| Sandaran | Sediakan panduan database/files backup dan restore test. Operasi backup server oleh pihak hosting. |
| Pemerhatian | Error log, email log, job log dan audit mudah dicapai oleh admin tanpa rahsia bocor. |
| Kebolehselenggaraan | Migrations, seeders, tests, README dan env example wajib. |

---

## 15. Peraturan perniagaan kritikal

1. Hanya ejen ACTIVE boleh mencipta referral dan claim baharu, kecuali exception yang direkod.
2. USAINS hanya boleh forward application apabila semua dokumen wajib VERIFIED atau NOT_APPLICABLE dengan sebab.
3. LEAP hanya boleh approve application yang VERIFIED.
4. Approval application tidak mengaktifkan ejen sehingga agreement FULLY_SIGNED.
5. Return, rejection, cancellation, suspension, not-renewal dan termination memerlukan alasan.
6. Ejen tidak boleh melihat nota dalaman, data ejen lain, bukti claim organisasi lain atau audit log penuh.
7. Duplicate referral check tidak boleh mendedahkan nama atau ID ejen lain.
8. FEES_PAID dan eligibility claim disahkan pegawai dalaman secara manual; ia bukan sekadar input ejen.
9. Rate komisen mesti di-snapshot pada claim supaya kadar baharu tidak mengubah claim lama secara senyap.
10. Payment hanya direkod selepas claim approved dan perlu mempunyai amaun, tarikh serta payment reference.
11. Annual review memaparkan snapshot prestasi ketika keputusan dibuat.
12. Workflow dan audit tidak dipadam fizikal melalui UI; gunakan status dan alasan.

---

## 16. Konfigurasi pentadbir

| Kategori | Tetapan |
|---|---|
| Dokumen | Checklist, wajib ikut jenis application, format file, max size, susunan dan active status. |
| Polisi/kewangan | Paid-up capital minimum, registration fee, performance bond, rate schedule, eligibility dan formula komisen. |
| SLA | Tempoh semakan, hari kalendar atau bekerja, warning threshold dan pemilik tindakan. |
| Pembaharuan | Agreement term, minimum referral, expiry alert, briefing requirement dan renewal policy. |
| Workflow | Role yang boleh bertindak, urutan tandatangan agreement dan reason/note requirement. |
| Notifikasi | Event, penerima, in-app/e-mail enable, template dan reminder. |
| Keselamatan | Registration mode, login limit, file upload type/size dan reset expiry. |

Perubahan konfigurasi penting perlu mempunyai version atau sekurang-kurangnya audit history supaya keputusan lama dapat dikaitkan kepada polisi ketika ia dibuat.

---

## 17. Kriteria penerimaan dan pelan ujian

Claude mesti membina test automatik untuk aliran teras dan menyediakan UAT checklist.

| ID | Kriteria penerimaan | Bukti minimum |
|---|---|---|
| AC-001 | Ejen boleh daftar/diundang, log masuk dan hanya melihat data organisasinya. | Authorization feature test dan UAT record. |
| AC-002 | Ejen boleh draft, lengkapkan application NEW, upload dokumen, ABC declaration dan submit. | Feature test dan validation file/field. |
| AC-003 | USAINS boleh verify dokumen, return dengan alasan dan forward kes lengkap ke LEAP. | Workflow test termasuk reason required. |
| AC-004 | LEAP boleh approve/reject/return dengan audit; approval menghasilkan agreement draft. | Workflow dan audit tests. |
| AC-005 | Ejen active hanya selepas agreement tiga pihak lengkap. | Lifecycle rule test. |
| AC-006 | Referral dicipta oleh ejen active; status diubah pegawai berkuasa dengan history dan tenant isolation. | Feature test dan UAT. |
| AC-007 | Claim tidak boleh dibayar sebelum lulus dan membawa snapshot kadar/eligibility. | Unit dan feature test. |
| AC-008 | Claim boleh return/reject/approve dan payment manual direkod bersama reference. | Workflow test. |
| AC-009 | Annual review mengenal pasti ejen hampir tamat dan menyokong renew/not renew/terminate dengan alasan. | Command dan feature test. |
| AC-010 | Dashboard/report mengikut role; CSV/PDF tidak bocor data organisasi lain. | Authorization dan export test. |
| AC-011 | SLA mula, warning dan overdue dikira melalui policy/cron serta muncul dalam queue. | Service/command test. |
| AC-012 | Upload berbahaya/terlalu besar ditolak; private file tidak boleh akses URL terus. | Security test dan manual check. |
| AC-013 | Audit untuk action penting direkod dan tiada UI boleh edit/delete audit. | Audit feature test. |
| AC-014 | README menerangkan setup, migration, seed, test, cron dan environment tanpa secrets. | Documentation review. |

Senario UAT minimum:

1. Ejen baharu submit application, USAINS return satu dokumen, ejen upload semula, USAINS verify, LEAP approve, agreement lengkap dan ejen active.
2. Ejen active mencipta referral, pegawai mengesahkan FEES_PAID, ejen submit claim, USAINS review, LEAP approve dan Payment Officer merekod bayaran.
3. Ejen hampir tamat muncul dalam annual review dan LEAP renew untuk tempoh baharu.
4. Ejen A cuba membuka application, referral atau claim ejen B dan sistem menolak dengan respons selamat.
5. Percubaan upload executable atau file melebihi limit ditolak.
6. Status change tanpa alasan wajib gagal validasi.
7. Report/CSV ejen hanya mengandungi data organisasinya.

---

## 18. Pakej kerja dan urutan pembangunan

Anggaran projek sehingga 14 minggu, tertakluk kepada maklum balas/UAT pelanggan. Claude membina mengikut urutan risiko dahulu.

| Pakej | Hasil | Ketergantungan | Definition of Done |
|---|---|---|---|
| WP-01 Foundation | Codebase, environment config, migrations, auth, RBAC, layout asas, audit foundation, seed data rekaan. | Repositori/stack disahkan. | User login, role/tenant checks diuji, README setup berfungsi. |
| WP-02 Application | Organization profile, New/Renewal wizard, checklist dokumen, ABC dan submit. | WP-01. | Ejen boleh submit; data dan file validate/private. |
| WP-03 Review and SLA | USAINS queue, verification, LEAP decision, workflow history, SLA policy/command. | WP-02. | Return-to-agent hingga approval diuji end-to-end. |
| WP-04 Agreement and Operations | Agreement tracker, referral, rate schedule, claim, eligibility, decision dan payment record. | WP-03. | Ejen active boleh referral/claim; payment selepas approval sahaja. |
| WP-05 Renewal and Reporting | Annual review, expiry alert, dashboard, notification dan report/export. | WP-04. | Annual review/report role based lulus UAT. |
| WP-06 Hardening and Handover | Security review, core tests, bug fix, UAT scripts, deployment/cron/backup guide. | WP-01 hingga WP-05. | AC kritikal lulus dan handover bundle lengkap. |

Selepas setiap pakej Claude perlu memulangkan:

- objektif pakej dan status siap;
- fail ditambah/diubah;
- migration, command dan test baharu;
- cara menguji secara lokal;
- keputusan ujian;
- isu, andaian atau keputusan yang perlu Hafiz sahkan;
- pengesahan skop asal masih dipatuhi.

---

## 19. Kontrak tindakan dan larangan

### Dibenarkan semasa pembangunan

- membaca repositori yang Hafiz tetapkan;
- menambah aplikasi, migrations, seeders, tests dan dokumentasi;
- memasang dependency biasa yang perlu serta direkod dalam manifest;
- menjalankan test, linter, migration dan local development commands;
- menggunakan data rekaan;
- mencadangkan perubahan kecil yang diperlukan untuk acceptance criteria, dengan justifikasi.

### Tidak dibenarkan tanpa arahan baharu Hafiz

- deploy, restart atau ubah staging/production;
- meminta, membaca atau menyalin kredensial production;
- menghantar e-mel kepada penerima sebenar;
- mencipta API, OAuth, SSO, webhook atau integration luaran;
- menjalankan migration pada database production;
- memadam data, menulis semula audit history atau menjalankan perintah destructive;
- commit atau push remote repository tanpa arahan eksplisit;
- menggunakan data peribadi sebenar dalam test, seeder atau screenshot;
- menganggap status tandatangan sistem sebagai e-signature undang-undang.

Claude mesti berhenti dan rujuk Hafiz jika akses pelayan/SMTP/secret diperlukan, spesifikasi bercanggah dengan codebase, kerja menjadi luar skop, data migration sebenar diminta atau polisi muktamad mengubah flow asas.

---

## 20. Bahan serahan pembangunan

Pada akhir pembangunan, sediakan:

1. Kod sumber lengkap dalam repositori.
2. Database migrations dan seed data rekaan.
3. README setup lokal, environment, migration, seed, test dan cron.
4. Env example tanpa secrets.
5. Senarai command cron untuk SLA, notifikasi dan e-mail.
6. Deployment guide asas bagi pelayan pelanggan termasuk storage permission, database, HTTPS dan backup/restore checklist.
7. Panduan pengguna ringkas untuk Ejen, USAINS, USM LEAP, Payment Officer dan Super Admin.
8. UAT checklist yang memetakan acceptance criteria.
9. Test report dan known limitations.
10. Handover summary yang menyenaraikan semua nilai DRAF perlu dikonfigurasi sebelum go-live.

Selaras quotation, waranti pembaikan pepijat ialah 90 hari selepas UAT/penerimaan dan tertakluk kepada skop asal. Fungsi baharu, integration, perubahan polisi besar atau coordination work ialah kerja tambahan.

---

## 21. Checklist pra-pembangunan Claude

- [ ] Lokasi repositori dikenal pasti dan perubahan pengguna tidak akan terjejas.
- [ ] Teknologi, dependency manager, arahan test dan run dikenal pasti.
- [ ] Keputusan D-006, D-012, D-013, D-014 dan D-015 difahami.
- [ ] Tiada API, SSO atau integration luar dimasukkan dalam plan awal.
- [ ] Pelan WP-01 hingga WP-06 dipadankan dengan codebase.
- [ ] Migration, private file storage dan environment variable strategy dicadangkan.
- [ ] RBAC, tenant isolation dan audit trail disahkan sebelum workflow dibina.
- [ ] Nilai DRAF yang perlu UAT diasingkan daripada fungsi wajib.
- [ ] Tiada secret, data sebenar atau deploy diperlukan untuk memulakan kerja lokal.

---

## 22. Prompt induk untuk diberikan kepada Claude

Salin teks ini bersama dokumen spesifikasi apabila memulakan kerja:

Anda ialah lead developer bagi USM Agent Gateway. Baca dokumen USM Agent Gateway Dokumen Spesifikasi Pembangunan dan Handoff untuk Claude Code versi 1.0 sepenuhnya dan jadikannya kontrak pembangunan utama.

Matlamat anda ialah membina aplikasi web production-minded untuk mengurus kitar hayat ejen pengambilan pelajar antarabangsa USM: akaun dan RBAC, permohonan ejen, dokumen dan deklarasi ABC, semakan USAINS, kelulusan USM LEAP, perjanjian, rujukan pelajar, tuntutan komisen, rekod bayaran manual, annual review, SLA, notifikasi, audit dan laporan.

Sempadan yang tidak boleh dilanggar: tiada API, SSO, webhook, integrasi sistem universiti atau kewangan, payment gateway, vendor e-signature atau kerja koordinasi antara organisasi. Status daripada sistem luar direkod manual oleh pegawai berautoriti dan perlu ada audit trail. Jangan deploy, jangan gunakan secrets atau data sebenar, jangan menghantar e-mel sebenar dan jangan commit/push tanpa arahan Hafiz.

Mula dengan PRA-PEMERIKSAAN SAHAJA. Periksa repositori yang Hafiz tetapkan, kemudian laporkan:

1. teknologi dan struktur sedia ada;
2. arahan setup/test yang ditemui;
3. pelan WP-01 hingga WP-06 yang dipadankan kepada repositori;
4. model data dan risiko utama;
5. andaian atau soalan yang benar-benar menghalang kerja.

Jangan menulis kod pada respons pertama jika lokasi repositori belum diberi atau pra-pemeriksaan menemui percanggahan material. Jika repositori jelas dan tiada blocker, cadangkan langkah pertama WP-01 dan tunggu arahan Hafiz untuk mula membina.

Apabila pembangunan dibenarkan, bina satu pakej kerja pada satu masa. Selepas setiap pakej, jalankan ujian relevan dan pulangkan: fail berubah, migration/command/test baharu, cara uji, keputusan ujian, risiko/baki kerja dan pengesahan bahawa skop masih dipatuhi.

---

## 23. Ringkasan untuk pemilik sistem

USM Agent Gateway bukan sekadar dashboard. Ia ialah sistem rekod dan kawalan kerja bagi perjalanan ejen daripada permohonan hingga pembaharuan. Ejen mendapat portal kendiri; USAINS mendapat konsol semakan; USM LEAP mendapat konsol kelulusan dan pemantauan; pengurusan mendapat dashboard dan laporan.

Ketiadaan API dalam fasa ini ditangani melalui kemas kini manual yang terkawal, berasaskan peranan dan boleh diaudit. Spesifikasi ini membina asas yang kuat untuk nilai RM35,000: workflow jelas, data tersusun, keselamatan dokumen, SLA, audit, laporan, ujian dan handover, sambil mengekalkan sempadan skop supaya pembangunan boleh disiapkan dengan terkawal.
