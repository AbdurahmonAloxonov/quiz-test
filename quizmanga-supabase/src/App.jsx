import { useState, useRef, useCallback, useEffect, Component } from "react";
import { auth, profiles as pApi, questions as qApi, tests as tApi, results as rApi, bookmarks as bApi, promoApi, groupApi, annApi } from "./lib/api";

// ═══════════════ SUBJECTS & CATEGORIES ═══════════════
const SUBJECTS = [
  { id:1,  name:"Matematika",  icon:"📐", color:"var(--accent)", short:"Mat", topics:["Algebra","Geometriya","Trigonometriya"] },
  { id:2,  name:"Fizika",      icon:"⚡", color:"#FF8C00", short:"Fiz", topics:["Mexanika","Elektr","Optika"] },
  { id:3,  name:"Kimyo",       icon:"🧪", color:"#00C896", short:"Kim", topics:["Organik","Anorganik","Umumiy"] },
  { id:4,  name:"Biologiya",   icon:"🧬", color:"#7B2FBE", short:"Bio", topics:["Botanika","Zoologiya","Anatomiya"] },
  { id:5,  name:"Tarix",       icon:"📜", color:"#C0392B", short:"Tar", topics:["O'zbekiston","Jahon","Qadimgi"] },
  { id:6,  name:"Geografiya",  icon:"🌍", color:"#1A85FF", short:"Geo", topics:["Fizik","Iqtisodiy","Tabiiy"] },
  { id:7,  name:"Ingliz tili", icon:"🗣️", color:"#E91E8C", short:"Ing", topics:["Grammar","Vocabulary","Reading"] },
  { id:8,  name:"Ona tili",    icon:"✍️", color:"#FF6B35", short:"Ona", topics:["Grammatika","Adabiyot","Imlo"] },
  { id:9,  name:"Informatika", icon:"💻", color:"#00B4D8", short:"Inf", topics:["Dasturlash","Tarmoq","Apparat"] },
  { id:10, name:"Huquq",       icon:"⚖️", color:"#4CAF50", short:"Huq", topics:["Konstitutsiya","Jinoyat","Fuqarolik"] },
  { id:11, name:"Iqtisodiyot", icon:"📊", color:"#9C27B0", short:"Iqt", topics:["Mikro","Makro","Moliya"] },
  { id:12, name:"O'quvchilar rivojlanishi", icon:"🌱", color:"#10B981", short:"ORiv", topics:["Jismoniy rivojlanish","Aqliy rivojlanish","Ijtimoiy rivojlanish"] },
  { id:13, name:"Rivojlanish psixologiyasi", icon:"🧠", color:"#8B5CF6", short:"RPsi", topics:["Yosh davrlari","Bilish jarayonlari","Shaxs psixologiyasi"] },
  { id:14, name:"Ta'lim nazariyalari", icon:"📚", color:"#6366F1", short:"TNaz", topics:["Konstruktivizm","Bixeviorizm","Zamonaviy nazariyalar"] },
  { id:15, name:"Pedagogning kasbiy rivojlanishi", icon:"👨‍🏫", color:"#0EA5E9", short:"PKas", topics:["Malaka oshirish","Refleksiya","Kasbiy etika"] },
  { id:16, name:"Zamonaviy ta'lim", icon:"💡", color:"#F59E0B", short:"ZTal", topics:["Interfaol metodlar","Raqamli ta'lim","STEAM"] },
  { id:17, name:"Formativ va summativ baholash", icon:"📝", color:"#EC4899", short:"Baho", topics:["Formativ baholash","Summativ baholash","Mezonlar"] },
  { id:18, name:"Morfofunksional o'zgarishlar", icon:"🫀", color:"#EF4444", short:"Morf", topics:["Organizm tuzilishi","Jismoniy yuklama","Tiklanish"] },
  { id:19, name:"Gimnastika", icon:"🤸", color:"#14B8A6", short:"Gim", topics:["Asosiy gimnastika","Snaryadlar","Akrobatika"] },
  { id:20, name:"Sport o'yinlari", icon:"⚽", color:"#22C55E", short:"SOyn", topics:["Futbol","Basketbol","Voleybol"] },
  { id:21, name:"Harakatli o'yinlar", icon:"🏃", color:"#F97316", short:"HOyn", topics:["Estafetalar","Jamoaviy o'yinlar","Qoidalar"] },
  { id:22, name:"Kurash", icon:"🤼", color:"#B45309", short:"Kur", topics:["Texnika","Qoidalar","Tarix"] },
  { id:23, name:"Yengil atletika", icon:"🏅", color:"#3B82F6", short:"YAtl", topics:["Yugurish","Sakrash","Uloqtirish"] },
  { id:24, name:"Sport musobaqalari", icon:"🏆", color:"#EAB308", short:"SMus", topics:["Olimpiada","Tashkil etish","Hakamlik"] },
  { id:25, name:"Ta'limda differensial yondashuv", icon:"🎯", color:"#D946EF", short:"Diff", topics:["Individual yondashuv","Maxsus ehtiyojlar","Tabaqalashtirish"] },
];
// Faqat PRO foydalanuvchilar uchun fanlar (PROda ham 5 martadan)
const PRO_SUBJECTS = new Set([9,10,12,13,14,15,16,17,18,19,20,21,22,23,24,25]);
const PRO_LIMIT = 5;
// Qurilma identifikatori (bitta akkaunt = bitta qurilma uchun)
function getDeviceId(){ try{ let d=localStorage.getItem("fe_device"); if(!d){ d=(typeof crypto!=="undefined"&&crypto.randomUUID)?crypto.randomUUID():(Date.now()+"-"+Math.random().toString(16).slice(2)); localStorage.setItem("fe_device",d);} return d; }catch(e){ return "nodevice"; } }
function isStaffRole(r){ return r==="admin"||r==="teacher"; }

const DIFF = {
  easy:   { label:"Oson",  ru:"Лёгкий", en:"Easy",   color:"#00C896" },
  medium: { label:"O'rta", ru:"Средний",en:"Medium", color:"#FF8C00" },
  hard:   { label:"Qiyin", ru:"Сложный",en:"Hard",   color:"var(--accent)" },
};

// q: text, o: options, a: correct index OR array (multi), multi: bool, diff, topic, exp: explanation
const Q_INIT = {
  1:[
    {q:"2x + 5 = 13 ni yeching",o:["x=3","x=4","x=5","x=6"],a:1,diff:"easy",topic:"Algebra",exp:"2x=8, x=4"},
    {q:"Katetlari 3 va 4 bo'lgan to'g'ri burchakli uchburchak gipotenuzasi",o:["5","6","7","8"],a:0,diff:"easy",topic:"Geometriya",exp:"√(9+16)=√25=5"},
    {q:"log₂(8) = ?",o:["2","3","4","5"],a:1,diff:"medium",topic:"Algebra",exp:"2³=8 → 3"},
    {q:"sin(90°) = ?",o:["0","0.5","1","√2/2"],a:2,diff:"easy",topic:"Trigonometriya",exp:"sin 90°=1"},
    {q:"Quyidagilardan tub sonlarni tanlang",o:["2","4","7","9"],a:[0,2],multi:true,diff:"medium",topic:"Algebra",exp:"2 va 7 tub sonlar"},
    {q:"x²−5x+6=0 ildizlari",o:["2 va 3","1 va 6","2 va 4","3 va 4"],a:0,diff:"medium",topic:"Algebra",exp:"(x-2)(x-3)=0"},
    {q:"a₁=2, d=3 bo'lsa a₅=?",o:["10","12","14","16"],a:2,diff:"medium",topic:"Algebra",exp:"2+4·3=14"},
    {q:"Doira yuzi formulasi",o:["πd","2πr","πr²","2πr²"],a:2,diff:"easy",topic:"Geometriya",exp:"S=πr²"},
    {q:"cos(0°) = ?",o:["0","1","-1","0.5"],a:1,diff:"easy",topic:"Trigonometriya",exp:"cos 0°=1"},
    {q:"∫x dx = ?",o:["x+C","x²+C","x²/2+C","2x+C"],a:2,diff:"hard",topic:"Algebra",exp:"x²/2 + C"},
  ],
  2:[
    {q:"Yorug'lik tezligi",o:["2×10⁸ m/s","3×10⁸ m/s","4×10⁸ m/s","5×10⁸ m/s"],a:1,diff:"easy",topic:"Optika",exp:"≈3×10⁸ m/s"},
    {q:"F=ma da 'a' nima?",o:["Kuch","Massa","Tezlanish","Tezlik"],a:2,diff:"easy",topic:"Mexanika",exp:"a — tezlanish"},
    {q:"Ohm qonuni U=?",o:["I/R","I×R","R/I","I+R"],a:1,diff:"easy",topic:"Elektr",exp:"U=I·R"},
    {q:"Erkin tushish tezlanishi",o:["8 m/s²","9 m/s²","9.8 m/s²","10.2 m/s²"],a:2,diff:"easy",topic:"Mexanika",exp:"g≈9.8 m/s²"},
    {q:"1 kWh = ? J",o:["3.6×10³","3.6×10⁵","3.6×10⁶","3.6×10⁷"],a:2,diff:"hard",topic:"Elektr",exp:"3.6×10⁶ J"},
    {q:"Issiqliq energiyasi formulasi",o:["Q=mct","Q=mv²","Q=Fs","Q=Pt"],a:0,diff:"medium",topic:"Mexanika",exp:"Q=mcΔt"},
    {q:"Atom yadrosida nima bor?",o:["Elektronlar","Proton va neytronlar","Faqat proton","Faqat neytron"],a:1,diff:"easy",topic:"Mexanika",exp:"proton+neytron"},
    {q:"Kinetik energiya formulasi",o:["E=mgh","E=mv²/2","E=Pt","E=qU"],a:1,diff:"medium",topic:"Mexanika",exp:"E=mv²/2"},
    {q:"1 atm ≈ ? Pa",o:["10⁴","10⁵","10⁶","10³"],a:1,diff:"medium",topic:"Mexanika",exp:"≈10⁵ Pa"},
    {q:"Ketma-ket ulangan rezistorlar umumiy R",o:["Kamayadi","Oshadi","O'zgarmaydi","Nolga teng"],a:1,diff:"medium",topic:"Elektr",exp:"R=R₁+R₂"},
  ],
  3:[
    {q:"Suvning formulasi",o:["H₂O","HO₂","H₂O₂","OH₂"],a:0,diff:"easy",topic:"Umumiy",exp:"H₂O"},
    {q:"Oltin belgisi",o:["Ag","Au","Al","Cu"],a:1,diff:"easy",topic:"Umumiy",exp:"Au (aurum)"},
    {q:"pH=7 nima?",o:["Kislotali","Neytral","Ishqoriy","Tuzli"],a:1,diff:"easy",topic:"Umumiy",exp:"pH=7 neytral"},
    {q:"NaCl nima?",o:["Shakar","Osh tuzi","Soda","Xlorid"],a:1,diff:"easy",topic:"Anorganik",exp:"osh tuzi"},
    {q:"Vodorod atom massasi",o:["1","2","4","8"],a:0,diff:"easy",topic:"Umumiy",exp:"≈1"},
    {q:"Quyidagilardan metallarni tanlang",o:["Temir","Kislorod","Mis","Oltingugurt"],a:[0,2],multi:true,diff:"medium",topic:"Anorganik",exp:"Temir va Mis"},
    {q:"Organik kimyo asosiy elementi",o:["Azot","Kislorod","Uglerod","Vodorod"],a:2,diff:"medium",topic:"Organik",exp:"Uglerod (C)"},
    {q:"H₂SO₄ nomi",o:["Xlorid","Sulfat kislota","Nitrat","Karbonat"],a:1,diff:"medium",topic:"Anorganik",exp:"sulfat kislota"},
    {q:"Avogadro soni",o:["6.02×10²³","3.14×10²³","6.02×10²²","6.02×10²⁴"],a:0,diff:"hard",topic:"Umumiy",exp:"6.02×10²³"},
    {q:"Elektrolitik dissotsiatsiya",o:["Yonish","Ionlarga parchalanish","Bug'lanish","Eritish"],a:1,diff:"hard",topic:"Umumiy",exp:"ionlarga ajralish"},
  ],
  4:[
    {q:"Fotosintez qayerda?",o:["Mitoxondriya","Xloroplast","Yadro","Ribosoma"],a:1,diff:"easy",topic:"Botanika",exp:"xloroplastda"},
    {q:"DNK to'liq nomi",o:["Dezoksiribonuklein kislota","Ribonuklein","Deoxyriboze","Nuklein"],a:0,diff:"medium",topic:"Anatomiya",exp:"DNK"},
    {q:"Odam xromosomalari soni",o:["23","44","46","48"],a:2,diff:"medium",topic:"Anatomiya",exp:"46 ta"},
    {q:"Qon guruhlari soni",o:["2","3","4","5"],a:2,diff:"easy",topic:"Anatomiya",exp:"4 ta"},
    {q:"Eng kichik tirik organizm",o:["Bakteriya","Virus","Zamburug'","Amyoba"],a:1,diff:"medium",topic:"Zoologiya",exp:"virus"},
    {q:"Mitoz natijasi",o:["2 hujayra","4 hujayra","8 hujayra","16"],a:0,diff:"medium",topic:"Anatomiya",exp:"2 ta"},
    {q:"ATP nima?",o:["Protein","Energiya molekulasi","Ferment","Vitamin"],a:1,diff:"hard",topic:"Anatomiya",exp:"energiya"},
    {q:"Meioz natijasi",o:["2","4","8","1"],a:1,diff:"hard",topic:"Anatomiya",exp:"4 ta"},
    {q:"Oqsil sintezi qayerda?",o:["Yadro","Ribosoma","Lizosom","Vakuol"],a:1,diff:"medium",topic:"Anatomiya",exp:"ribosomada"},
    {q:"Qon tozalaydigan organ",o:["Yurak","Jigar","Buyrak","O'pka"],a:2,diff:"easy",topic:"Anatomiya",exp:"buyrak"},
  ],
  5:[
    {q:"O'zbekiston mustaqilligi yili",o:["1989","1990","1991","1992"],a:2,diff:"easy",topic:"O'zbekiston",exp:"1991-yil 1-sentabr"},
    {q:"Amir Temur tug'ilgan yil",o:["1336","1346","1356","1366"],a:0,diff:"medium",topic:"O'zbekiston",exp:"1336"},
    {q:"Birinchi Jahon urushi boshlandi",o:["1912","1913","1914","1915"],a:2,diff:"medium",topic:"Jahon",exp:"1914"},
    {q:"Buyuk Ipak yo'li markazlari",o:["Samarqand","Toshkent","Buxoro","Barchasi"],a:3,diff:"easy",topic:"Qadimgi",exp:"barchasi"},
    {q:"Ikkinchi Jahon urushi tugadi",o:["1943","1944","1945","1946"],a:2,diff:"easy",topic:"Jahon",exp:"1945"},
    {q:"Amir Temur poytaxti",o:["Buxoro","Samarqand","Toshkent","Xiva"],a:1,diff:"easy",topic:"O'zbekiston",exp:"Samarqand"},
    {q:"Frantsuz inqilobi yili",o:["1776","1789","1804","1815"],a:1,diff:"medium",topic:"Jahon",exp:"1789"},
    {q:"O'zbekistonda sovet hokimiyati",o:["1917","1920","1924","1930"],a:1,diff:"hard",topic:"O'zbekiston",exp:"1920"},
    {q:"Qo'qon xonligi tashkil topdi",o:["1709","1720","1750","1800"],a:0,diff:"hard",topic:"O'zbekiston",exp:"1709"},
    {q:"O'zbekiston birinchi Prezidenti",o:["Sh.Mirziyoyev","I.Karimov","A.Temur","B.Muxtorov"],a:1,diff:"easy",topic:"O'zbekiston",exp:"I.Karimov"},
  ],
  6:[
    {q:"O'zbekiston poytaxti",o:["Samarqand","Namangan","Toshkent","Buxoro"],a:2,diff:"easy",topic:"Iqtisodiy",exp:"Toshkent"},
    {q:"Eng baland tog'",o:["K2","Everest","Kilimanjaro","Mont Blanc"],a:1,diff:"easy",topic:"Fizik",exp:"Everest"},
    {q:"Orol dengizi davlatlari",o:["O'z-Toj","O'z-Qoz","Qirg'-Toj","Turk-Eron"],a:1,diff:"medium",topic:"Fizik",exp:"O'zb-Qozog'."},
    {q:"Eng uzun daryo",o:["Amazon","Nil","Yantszi","Volga"],a:1,diff:"medium",topic:"Fizik",exp:"Nil"},
    {q:"O'zbekiston viloyatlari soni",o:["10","12","14","16"],a:2,diff:"easy",topic:"Iqtisodiy",exp:"14 ta"},
    {q:"Eng katta materik",o:["Amerika","Afrika","Yevropa","Osiyo"],a:3,diff:"easy",topic:"Fizik",exp:"Osiyo"},
    {q:"O'zbekiston eng baland nuqtasi",o:["Chimyon","Beshtor","Hazratisulton","Zarafshon"],a:1,diff:"hard",topic:"Fizik",exp:"Beshtor"},
    {q:"Amudaryo quyiladi",o:["Kaspiy","Orol","Qora dengiz","Balxash"],a:1,diff:"medium",topic:"Fizik",exp:"Orol"},
    {q:"O'zbekiston eng katta viloyati",o:["Qashqadaryo","Surxondaryo","Navoiy","Buxoro"],a:2,diff:"hard",topic:"Iqtisodiy",exp:"Navoiy"},
    {q:"Eng chuqur ko'l",o:["Kaspiy","Baykol","Viktoriya","Orol"],a:1,diff:"medium",topic:"Fizik",exp:"Baykol"},
  ],
  7:[
    {q:"Past tense of 'go'",o:["goed","went","gone","going"],a:1,diff:"easy",topic:"Grammar",exp:"went"},
    {q:"She ___ a doctor.",o:["am","is","are","be"],a:1,diff:"easy",topic:"Grammar",exp:"is"},
    {q:"'Ubiquitous' means",o:["Rare","Everywhere","Large","Quick"],a:1,diff:"hard",topic:"Vocabulary",exp:"everywhere"},
    {q:"Plural of 'child'",o:["childs","childes","children","child's"],a:2,diff:"easy",topic:"Grammar",exp:"children"},
    {q:"Studying ___ 3 hours",o:["since","for","during","from"],a:1,diff:"medium",topic:"Grammar",exp:"for"},
    {q:"Comparative of 'good'",o:["gooder","more good","better","best"],a:2,diff:"easy",topic:"Grammar",exp:"better"},
    {q:"Choose the verbs",o:["run","table","jump","blue"],a:[0,2],multi:true,diff:"medium",topic:"Grammar",exp:"run, jump"},
    {q:"Synonym for 'happy'",o:["Sad","Joyful","Angry","Tired"],a:1,diff:"easy",topic:"Vocabulary",exp:"joyful"},
    {q:"He ___ been here since 2010",o:["have","has","had","is"],a:1,diff:"medium",topic:"Grammar",exp:"has"},
    {q:"If I ___ rich, I would travel",o:["am","was","were","be"],a:2,diff:"hard",topic:"Grammar",exp:"were"},
  ],
  8:[
    {q:"O'zbek alifbosida harflar soni",o:["26","29","32","35"],a:1,diff:"easy",topic:"Grammatika",exp:"29 ta"},
    {q:"'Alpomish' qanday asar?",o:["Yozma","Xalq eposi","Navoiy asari","Bobur"],a:1,diff:"medium",topic:"Adabiyot",exp:"xalq eposi"},
    {q:"Alisher Navoiy tug'ilgan yil",o:["1441","1451","1461","1471"],a:0,diff:"hard",topic:"Adabiyot",exp:"1441"},
    {q:"O'zbek tilida unlilar soni",o:["4","5","6","7"],a:2,diff:"medium",topic:"Grammatika",exp:"6 ta"},
    {q:"'Xamsa' muallifi",o:["Bobur","Navoiy","Lutfiy","Ulug'bek"],a:1,diff:"medium",topic:"Adabiyot",exp:"Navoiy"},
    {q:"O'zbek tilida kelishiklar soni",o:["4","5","6","7"],a:2,diff:"medium",topic:"Grammatika",exp:"6 ta"},
    {q:"'Devonu lug'otit turk' muallifi",o:["Navoiy","Yusuf Xos Hojib","Mahmud Koshg'ariy","Beruniy"],a:2,diff:"hard",topic:"Adabiyot",exp:"M.Koshg'ariy"},
    {q:"'Baburnoma' muallifi",o:["Temur","Ulug'bek","Bobur","Navoiy"],a:2,diff:"easy",topic:"Adabiyot",exp:"Bobur"},
    {q:"So'z turkumlari soni",o:["8","9","10","12"],a:2,diff:"medium",topic:"Grammatika",exp:"10 ta"},
    {q:"Ot so'z turkumi nimani bildiradi?",o:["Harakat","Belgi","Narsa","Miqdor"],a:2,diff:"easy",topic:"Grammatika",exp:"narsa-tushuncha"},
  ],
  9:[
    {q:"Birinchi kompyuter yaratildi",o:["1930","1940","1945","1950"],a:2,diff:"medium",topic:"Apparat",exp:"≈1945"},
    {q:"HTML nima?",o:["Dasturlash tili","Belgilash tili","MB","OS"],a:1,diff:"easy",topic:"Dasturlash",exp:"markup tili"},
    {q:"1 bayt = ? bit",o:["4","6","8","16"],a:2,diff:"easy",topic:"Apparat",exp:"8 bit"},
    {q:"Python turi",o:["Kompilatsiya","Interpretatsiya","Assembler","Mashina"],a:1,diff:"medium",topic:"Dasturlash",exp:"interpretator"},
    {q:"WWW kim yaratgan?",o:["Gates","Tim Berners-Lee","Jobs","Torvalds"],a:1,diff:"hard",topic:"Tarmoq",exp:"Berners-Lee"},
    {q:"OOP da inheritance",o:["Inkapsulyatsiya","Meros olish","Polimorfizm","Abstraksiya"],a:1,diff:"hard",topic:"Dasturlash",exp:"meros"},
    {q:"1 KB = ? byte",o:["512","1000","1024","2048"],a:2,diff:"medium",topic:"Apparat",exp:"1024"},
    {q:"SQL nima?",o:["Dasturlash tili","MB so'rov tili","Protokol","OS"],a:1,diff:"medium",topic:"Dasturlash",exp:"MB tili"},
    {q:"Binary 1010 = decimal",o:["8","10","12","14"],a:1,diff:"hard",topic:"Dasturlash",exp:"10"},
    {q:"Internet protokoli",o:["HTML","HTTP","CPU","RAM"],a:1,diff:"easy",topic:"Tarmoq",exp:"HTTP"},
  ],
  10:[
    {q:"O'zbekiston Konstitutsiyasi yili",o:["1990","1991","1992","1993"],a:2,diff:"easy",topic:"Konstitutsiya",exp:"1992-yil 8-dekabr"},
    {q:"Fuqarolik yoshi",o:["16","17","18","21"],a:2,diff:"easy",topic:"Fuqarolik",exp:"18 yosh"},
    {q:"Prezident muddati",o:["4 yil","5 yil","6 yil","7 yil"],a:1,diff:"medium",topic:"Konstitutsiya",exp:"7 yil"},
    {q:"Oliy Majlis palatalari soni",o:["1","2","3","4"],a:1,diff:"medium",topic:"Konstitutsiya",exp:"2 palata"},
    {q:"Qonunchilik tashabbusi",o:["Faqat Prezident","Faqat deputat","Ikkalasi","Hamma"],a:2,diff:"hard",topic:"Konstitutsiya",exp:"ikkalasiga"},
    {q:"Huquqning asosiy manbai",o:["Qaror","Qonun","Farmon","Buyruq"],a:1,diff:"easy",topic:"Fuqarolik",exp:"qonun"},
    {q:"Jinoyat kodeksi nimani belgilaydi?",o:["Soliq","Jinoyat va jazo","Nikoh","Meros"],a:1,diff:"medium",topic:"Jinoyat",exp:"jinoyat-jazo"},
    {q:"Sud mustaqilligi asosi",o:["Qonunga bo'ysunish","Hokimiyatga","Manfaatga","Yo'q"],a:0,diff:"hard",topic:"Konstitutsiya",exp:"qonunga"},
    {q:"Fuqarolik jamiyati elementi",o:["Davlat","Nodavlat tashkilotlar","Armiya","Soliq"],a:1,diff:"hard",topic:"Fuqarolik",exp:"NNT"},
    {q:"Prezident immuniteti",o:["Ha","Yo'q","Qisman","Tashqarida"],a:0,diff:"medium",topic:"Konstitutsiya",exp:"ha"},
  ],
  11:[
    {q:"Bozor iqtisodiyoti belgisi",o:["Davlat nazorati","Erkin raqobat","Markaziy reja","Soliqlar"],a:1,diff:"easy",topic:"Makro",exp:"erkin raqobat"},
    {q:"Inflyatsiya nima?",o:["Narx pasayishi","Narx oshishi","Ish haqi","Kurs"],a:1,diff:"easy",topic:"Makro",exp:"narx oshishi"},
    {q:"YaIM nima?",o:["Yillik ishlab chiqarish","Import","Moliya","Investitsiya"],a:0,diff:"medium",topic:"Makro",exp:"YaIM"},
    {q:"Talab qonuni",o:["Narx oshsa talab oshadi","Narx oshsa talab kamayadi","O'zgarmaydi","Boshqa"],a:1,diff:"medium",topic:"Mikro",exp:"teskari"},
    {q:"Monopoliya nima?",o:["Ko'p sotuvchi","Bitta sotuvchi","Davlat","Erkin"],a:1,diff:"easy",topic:"Mikro",exp:"bitta sotuvchi"},
    {q:"Resurslar cheklanganligi",o:["Deficit","Tanglik","Kamlik","Scarcity"],a:3,diff:"hard",topic:"Mikro",exp:"scarcity"},
    {q:"Elastiklik nima?",o:["Talab o'zgarishi","Ishlab chiqarish","Eksport","Import"],a:0,diff:"hard",topic:"Mikro",exp:"sezgirlik"},
    {q:"Soliq turlari",o:["To'g'ri va egri","Katta-kichik","Eski-yangi","Milliy"],a:0,diff:"medium",topic:"Moliya",exp:"to'g'ri-egri"},
    {q:"Valyuta kursi nima?",o:["Inflyatsiya","Valyutalar nisbati","YaIM","Foiz"],a:1,diff:"medium",topic:"Moliya",exp:"nisbat"},
    {q:"Pul muomalasini nazorat",o:["Iste'molchi","Markaziy bank","Hukumat","Fond"],a:1,diff:"medium",topic:"Moliya",exp:"Markaziy bank"},
  ],
  12:[
    {q:"O'quvchi rivojlanishida eng muhim omil",o:["Faqat genetika","Nasl va muhit birgalikda","Faqat tasodif","Faqat maktab"],a:1,diff:"medium",topic:"Aqliy rivojlanish",exp:"nasl va muhit"},
    {q:"Bola jismoniy rivojlanishi nimadan bilinadi?",o:["Bo'y va vazn o'sishi","Faqat baho","Kiyimi","Telefoni"],a:0,diff:"easy",topic:"Jismoniy rivojlanish",exp:"bo'y-vazn"},
    {q:"Ijtimoiy rivojlanish nima?",o:["Yolg'iz qolish","Boshqalar bilan munosabat o'rnatish","Faqat o'yin","Uxlash"],a:1,diff:"easy",topic:"Ijtimoiy rivojlanish",exp:"muloqot va munosabat"},
    {q:"Aqliy rivojlanishni nima qo'llab-quvvatlaydi?",o:["Faol o'rganish","Harakatsizlik","Qo'rquv","Jazo"],a:0,diff:"medium",topic:"Aqliy rivojlanish",exp:"faol o'rganish"},
  ],
  13:[
    {q:"Rivojlanish psixologiyasi nimani o'rganadi?",o:["Tabiatni","Insonning yoshga oid o'zgarishini","Iqtisodni","Tarixni"],a:1,diff:"easy",topic:"Yosh davrlari",exp:"yoshga oid psixik o'zgarishlar"},
    {q:"Vygotskiyning 'yaqin rivojlanish zonasi' nima?",o:["Maktab hovlisi","Yordamsiz va yordam bilan qilish oralig'i","Imtihon","Dam olish"],a:1,diff:"hard",topic:"Bilish jarayonlari",exp:"YaRZ"},
    {q:"Bilish jarayoniga nima kiradi?",o:["Diqqat va xotira","Faqat uyqu","Faqat ovqat","Sport"],a:0,diff:"medium",topic:"Bilish jarayonlari",exp:"diqqat, xotira, tafakkur"},
    {q:"O'smirlik davri qaysi yoshga to'g'ri keladi?",o:["3-5 yosh","11-17 yosh","30-40 yosh","60+"],a:1,diff:"medium",topic:"Yosh davrlari",exp:"taxminan 11-17"},
  ],
  14:[
    {q:"Konstruktivizm nazariyasi asosi",o:["Bilim quyiladi","O'quvchi bilimni o'zi quradi","Faqat takror","Jazo"],a:1,diff:"hard",topic:"Konstruktivizm",exp:"bilimni faol qurish"},
    {q:"Bixeviorizm nimaga e'tibor beradi?",o:["Xulq-atvor","Tush","Ovqat","Ob-havo"],a:0,diff:"medium",topic:"Bixeviorizm",exp:"kuzatiladigan xulq"},
    {q:"Ta'lim nazariyasi nima uchun kerak?",o:["O'qitishni asoslash","Bezak uchun","Hech nima","Reklama"],a:0,diff:"easy",topic:"Zamonaviy nazariyalar",exp:"o'qitishni ilmiy asoslash"},
    {q:"Zamonaviy nazariyalar o'quvchini qanday ko'radi?",o:["Passiv idrok etuvchi","Faol ishtirokchi","Tomoshabin","Mehmon"],a:1,diff:"medium",topic:"Zamonaviy nazariyalar",exp:"faol ishtirokchi"},
  ],
  15:[
    {q:"Pedagog kasbiy rivojlanishi nima?",o:["Faqat ish staji","Uzluksiz o'rganish va malaka oshirish","Maosh","Dam olish"],a:1,diff:"easy",topic:"Malaka oshirish",exp:"uzluksiz o'sish"},
    {q:"Refleksiya nima?",o:["O'z faoliyatini tahlil qilish","Uxlash","Yodlash","Imtihon"],a:0,diff:"medium",topic:"Refleksiya",exp:"o'z-o'zini tahlil"},
    {q:"Kasbiy etika nimani talab qiladi?",o:["Adolat va hurmat","Beparvolik","Qo'pollik","Sirni oshkor qilish"],a:0,diff:"easy",topic:"Kasbiy etika",exp:"adolat, hurmat, maxfiylik"},
    {q:"Malaka oshirish qanday amalga oshiriladi?",o:["Kurslar va o'z-o'zini rivojlantirish","Hech qanday","Faqat ta'til","Tasodifan"],a:0,diff:"easy",topic:"Malaka oshirish",exp:"kurs, trening, mutolaa"},
  ],
  16:[
    {q:"Interfaol metod nima?",o:["Faqat ma'ruza","O'quvchilarning faol o'zaro ishtiroki","Yodlash","Jazo"],a:1,diff:"easy",topic:"Interfaol metodlar",exp:"o'zaro faol ishtirok"},
    {q:"Raqamli ta'lim vositasi qaysi?",o:["Onlayn platformalar","Bo'r","Daftar","Hech nima"],a:0,diff:"easy",topic:"Raqamli ta'lim",exp:"onlayn vositalar"},
    {q:"STEAM nimani birlashtiradi?",o:["Fan, texnologiya, muhandislik, san'at, matematika","Faqat sport","Faqat til","Tarix"],a:0,diff:"medium",topic:"STEAM",exp:"S-T-E-A-M"},
    {q:"Zamonaviy darsda o'qituvchi roli",o:["Yo'naltiruvchi (fasilitator)","Faqat so'zlovchi","Nazoratchi","Passiv"],a:0,diff:"medium",topic:"Interfaol metodlar",exp:"fasilitator"},
  ],
  17:[
    {q:"Formativ baholash qachon o'tkaziladi?",o:["O'quv jarayonida","Faqat yil oxirida","Hech qachon","Faqat imtihonda"],a:0,diff:"medium",topic:"Formativ baholash",exp:"jarayon davomida"},
    {q:"Summativ baholash maqsadi",o:["Yakuniy natijani aniqlash","Bezak","Jarima","O'yin"],a:0,diff:"medium",topic:"Summativ baholash",exp:"davr oxiridagi yakun"},
    {q:"Baholash mezonlari nima uchun kerak?",o:["Adolatli va aniq baholash","Chalkashtirish","Hech nima","Reklama"],a:0,diff:"easy",topic:"Mezonlar",exp:"shaffof, adolatli baho"},
    {q:"Formativ baholashning ustunligi",o:["O'quvchini yo'naltiradi","Faqat baho qo'yadi","Qo'rqitadi","Foydasiz"],a:0,diff:"easy",topic:"Formativ baholash",exp:"o'sishga yordam"},
  ],
  18:[
    {q:"Sog'lom kattaning normal pulsi (daqiqada)",o:["40-50","60-100","120-140","150+"],a:1,diff:"medium",topic:"Organizm tuzilishi",exp:"60-100"},
    {q:"Jismoniy yuklamadan keyin nima muhim?",o:["Tiklanish (dam olish)","Darrov yana mashq","Ovqatlanmaslik","Uxlamaslik"],a:0,diff:"easy",topic:"Tiklanish",exp:"tiklanish davri"},
    {q:"Muntazam mashq yurakka qanday ta'sir qiladi?",o:["Kuchaytiradi","Zaiflashtiradi","Ta'sir yo'q","To'xtatadi"],a:0,diff:"medium",topic:"Jismoniy yuklama",exp:"yurak mushagi kuchayadi"},
    {q:"Skelet-mushak tizimi vazifasi",o:["Harakat va tayanch","Ovqat hazmi","Nafas","Ko'rish"],a:0,diff:"easy",topic:"Organizm tuzilishi",exp:"harakat va tayanch"},
  ],
  19:[
    {q:"Gimnastikada muvozanat snaryadi",o:["Turnik","Yog'och (brevno)","Halqa","Bolg'a"],a:1,diff:"medium",topic:"Snaryadlar",exp:"muvozanat yog'ochi"},
    {q:"Akrobatika nimani talab qiladi?",o:["Egiluvchanlik va muvozanat","Faqat kuch","Faqat tezlik","Hech nima"],a:0,diff:"medium",topic:"Akrobatika",exp:"egiluvchanlik, muvozanat"},
    {q:"Asosiy gimnastika maqsadi",o:["Umumiy jismoniy tayyorgarlik","Faqat musobaqa","Dam olish","O'yin"],a:0,diff:"easy",topic:"Asosiy gimnastika",exp:"umumiy tayyorgarlik"},
    {q:"Gimnastikada xavfsizlik uchun nima kerak?",o:["Qizdirish va sug'urta","Hech nima","Shoshilish","Charchoq"],a:0,diff:"easy",topic:"Asosiy gimnastika",exp:"razminka, sug'urta"},
  ],
  20:[
    {q:"Futbol jamoasida maydonda nechta o'yinchi?",o:["9","10","11","12"],a:2,diff:"easy",topic:"Futbol",exp:"11 ta"},
    {q:"Basketbolda bir savatga eng ko'p necha ochko?",o:["1","2","3","4"],a:2,diff:"medium",topic:"Basketbol",exp:"3 ochko"},
    {q:"Voleybolda maydonda nechta o'yinchi?",o:["5","6","7","8"],a:1,diff:"easy",topic:"Voleybol",exp:"6 ta"},
    {q:"Futbolda o'yin davomiyligi (asosiy)",o:["2x45 daqiqa","2x30","4x15","60 daqiqa"],a:0,diff:"easy",topic:"Futbol",exp:"2x45"},
  ],
  21:[
    {q:"Harakatli o'yinlar asosan nimani rivojlantiradi?",o:["Tezkorlik va koordinatsiya","Faqat xotira","Faqat kuch","Hech nima"],a:0,diff:"easy",topic:"Jamoaviy o'yinlar",exp:"tezkorlik, koordinatsiya"},
    {q:"Estafeta o'yini nima?",o:["Navbatma-navbat jamoaviy yugurish","Yolg'iz o'tirish","Yozish","Uxlash"],a:0,diff:"easy",topic:"Estafetalar",exp:"jamoaviy navbatli musobaqa"},
    {q:"Harakatli o'yinda eng muhimi",o:["Qoidalarga rioya","Qoidasizlik","Janjal","Beparvolik"],a:0,diff:"easy",topic:"Qoidalar",exp:"qoidaga rioya"},
    {q:"Jamoaviy o'yin nimani o'rgatadi?",o:["Hamkorlik","Yolg'izlik","Raqobatsizlik","Dangasalik"],a:0,diff:"easy",topic:"Jamoaviy o'yinlar",exp:"hamkorlik"},
  ],
  22:[
    {q:"Kurash qaysi mamlakat milliy sporti?",o:["Yaponiya","O'zbekiston","Braziliya","Koreya"],a:1,diff:"easy",topic:"Tarix",exp:"O'zbekiston"},
    {q:"Kurashda g'alaba qachon bo'ladi?",o:["Raqibni belgilangan usulda yiqitganda","Qochganda","Yig'laganda","Kechikiganda"],a:0,diff:"medium",topic:"Qoidalar",exp:"to'g'ri texnika bilan yiqitish"},
    {q:"Kurash mashg'ulotida muhim sifat",o:["Kuch va muvozanat","Faqat tezlik","Hech nima","Dangasalik"],a:0,diff:"medium",topic:"Texnika",exp:"kuch, muvozanat, texnika"},
    {q:"Kurash bahosida 'halol' nimani anglatadi?",o:["Toza g'alaba","Mag'lubiyat","Durang","Jarima"],a:0,diff:"medium",topic:"Qoidalar",exp:"toza, aniq g'alaba"},
  ],
  23:[
    {q:"Marafon masofasi necha km?",o:["21.1 km","42.2 km","50 km","100 km"],a:1,diff:"medium",topic:"Yugurish",exp:"42.195 km"},
    {q:"Eng qisqa sprint masofasi",o:["100 m","400 m","800 m","1500 m"],a:0,diff:"easy",topic:"Yugurish",exp:"100 m"},
    {q:"Uzunlikka sakrash qaysi turkumga kiradi?",o:["Sakrash","Yugurish","Uloqtirish","Suzish"],a:0,diff:"easy",topic:"Sakrash",exp:"sakrash turi"},
    {q:"Disk uloqtirish qaysi turkum?",o:["Uloqtirish","Yugurish","Sakrash","Gimnastika"],a:0,diff:"easy",topic:"Uloqtirish",exp:"uloqtirish turi"},
  ],
  24:[
    {q:"Olimpiada o'yinlari necha yilda bir?",o:["2","3","4","5"],a:2,diff:"easy",topic:"Olimpiada",exp:"4 yilda"},
    {q:"Musobaqada hakam vazifasi",o:["Qoidaga rioyani nazorat qilish","O'ynash","Tomosha","Yozish"],a:0,diff:"easy",topic:"Hakamlik",exp:"qoidani nazorat"},
    {q:"Musobaqani tashkil etishda birinchi qadam",o:["Nizom (reglament) tuzish","Sovrin berish","Tarqalish","Hech nima"],a:0,diff:"medium",topic:"Tashkil etish",exp:"nizom tuzish"},
    {q:"Zamonaviy Olimpiada qayerda boshlangan?",o:["Yunoniston","Italiya","Misr","Xitoy"],a:0,diff:"medium",topic:"Olimpiada",exp:"Afina, 1896"},
  ],
  25:[
    {q:"Differensial yondashuv nima?",o:["Hammaga bir xil","Har o'quvchiga moslab o'qitish","Faqat kuchlilarga","Baho qo'ymaslik"],a:1,diff:"medium",topic:"Individual yondashuv",exp:"individual ehtiyojga moslash"},
    {q:"Maxsus ehtiyojli o'quvchiga nima kerak?",o:["Moslashtirilgan yondashuv","E'tiborsizlik","Bir xil talab","Chetlatish"],a:0,diff:"medium",topic:"Maxsus ehtiyojlar",exp:"moslashtirilgan ta'lim"},
    {q:"Tabaqalashtirish (differensiatsiya) maqsadi",o:["Har kimga mos qiyinlik","Chalkashtirish","Faqat imtihon","Hech nima"],a:0,diff:"easy",topic:"Tabaqalashtirish",exp:"darajaga mos topshiriq"},
    {q:"Individual yondashuv nimaga tayanadi?",o:["O'quvchining qobiliyati va sur'atiga","Tasodifga","Faqat yoshiga","Hech nimaga"],a:0,diff:"medium",topic:"Individual yondashuv",exp:"shaxsiy xususiyat"},
  ],
};

const DTM_BLOCKS = [
  {name:"Texnika",   subjects:[8,1,2],  counts:[10,30,30], color:"var(--accent)", icon:"⚙️", desc:"Ona tili + Matematika + Fizika"},
  {name:"Tibbiyot",  subjects:[8,3,4],  counts:[10,30,30], color:"#00C896", icon:"🏥", desc:"Ona tili + Kimyo + Biologiya"},
  {name:"Iqtisod",   subjects:[8,1,11], counts:[10,30,30], color:"#9C27B0", icon:"💰", desc:"Ona tili + Matematika + Iqtisodiyot"},
  {name:"Gumanitar", subjects:[8,5,6],  counts:[10,30,30], color:"#1A85FF", icon:"📚", desc:"Ona tili + Tarix + Geografiya"},
  {name:"IT",        subjects:[8,1,9],  counts:[10,30,30], color:"#00B4D8", icon:"💻", desc:"Ona tili + Matematika + Informatika"},
  {name:"Huquq",     subjects:[8,5,10], counts:[10,30,30], color:"#FF8C00", icon:"⚖️", desc:"Ona tili + Tarix + Huquq"},
];

const ROLES = { student:{label:"O'quvchi",icon:"🎓"}, teacher:{label:"O'qituvchi",icon:"👨‍🏫"}, admin:{label:"Administrator",icon:"⚙️"} };
const AVATARS = ["🦊","🐱","🐼","🦁","🐯","🐸","🐵","🦄","🐨","🐮","🐧","🦉","🐺","🦝","🐹","🐰"];

// ═══════════════ i18n ═══════════════
const I18N = {
  uz:{ login:"Kirish",register:"Ro'yxatdan o'tish",email:"Email",password:"Parol",name:"Ism familiya",confirm:"Parolni tasdiqlang",role:"Rol",logout:"Chiqish",dashboard:"Bosh sahifa",subjects:"Fanlar",profile:"Profil",admin:"Admin",analytics:"Analitika",proHub:"PRO Hub",start:"Boshlash",next:"Keyingi",prev:"Oldingi",finish:"Yakunlash",result:"Natija",correct:"to'g'ri",retry:"Qayta",review:"Tahlil",back:"Orqaga",lang:"Til",theme:"Tema",sound:"Ovoz",forgotPw:"Parolni unutdingizmi?",verifyTitle:"Emailni tasdiqlash",verifyDesc:"Emailingizga yuborilgan 4 xonali kodni kiriting",verify:"Tasdiqlash",resetPw:"Parolni tiklash",newPw:"Yangi parol",save:"Saqlash",welcome:"Xush kelibsiz",bookmark:"Belgilash",bookmarked:"Belgilangan",explanation:"Izoh",yourAnswer:"Sizning javobingiz",correctAnswer:"To'g'ri javob" },
  ru:{ login:"Вход",register:"Регистрация",email:"Эл. почта",password:"Пароль",name:"Имя Фамилия",confirm:"Подтвердите пароль",role:"Роль",logout:"Выход",dashboard:"Главная",subjects:"Предметы",profile:"Профиль",admin:"Админ",analytics:"Аналитика",proHub:"PRO Hub",start:"Начать",next:"Далее",prev:"Назад",finish:"Завершить",result:"Результат",correct:"верно",retry:"Заново",review:"Разбор",back:"Назад",lang:"Язык",theme:"Тема",sound:"Звук",forgotPw:"Забыли пароль?",verifyTitle:"Подтверждение Email",verifyDesc:"Введите 4-значный код из письма",verify:"Подтвердить",resetPw:"Сброс пароля",newPw:"Новый пароль",save:"Сохранить",welcome:"Добро пожаловать",bookmark:"Закладка",bookmarked:"В закладках",explanation:"Пояснение",yourAnswer:"Ваш ответ",correctAnswer:"Правильный ответ" },
  en:{ login:"Login",register:"Register",email:"Email",password:"Password",name:"Full name",confirm:"Confirm password",role:"Role",logout:"Logout",dashboard:"Dashboard",subjects:"Subjects",profile:"Profile",admin:"Admin",analytics:"Analytics",proHub:"PRO Hub",start:"Start",next:"Next",prev:"Previous",finish:"Finish",result:"Result",correct:"correct",retry:"Retry",review:"Review",back:"Back",lang:"Language",theme:"Theme",sound:"Sound",forgotPw:"Forgot password?",verifyTitle:"Verify Email",verifyDesc:"Enter the 4-digit code sent to your email",verify:"Verify",resetPw:"Reset password",newPw:"New password",save:"Save",welcome:"Welcome",bookmark:"Bookmark",bookmarked:"Bookmarked",explanation:"Explanation",yourAnswer:"Your answer",correctAnswer:"Correct answer" },
};

// ═══════════════ THEMES ═══════════════
const THEMES = {
  // CLEAN DARK (modern dashboard)
  dark:  { mode:"dark", bg:"#0F1218", card:"#171B22", border:"#242A33", text:"#E7EAF1", sub:"#8A93A6", faint:"#5A6273", input:"#141821", nav:"#141821", soft:"#1C212B",
           accent:"#4B6BFF", accent2:"#FBBF24", accent2Text:"#1A1208",
           fontDisplay:"'Plus Jakarta Sans',system-ui,sans-serif", fontBody:"'Plus Jakarta Sans',system-ui,sans-serif",
           cardBd:"#242A33", cardBdW:"1px", radius:14, cardShadow:"0 1px 2px rgba(0,0,0,.35)", cardHover:"0 10px 28px rgba(0,0,0,.5)",
           a08:"#4B6BFF14", a12:"#4B6BFF1f", a14:"#4B6BFF24", a15:"#4B6BFF26", a20:"#4B6BFF33", a30:"#4B6BFF4d", a40:"#4B6BFF66", a55:"#4B6BFF8c" },
  // CLEAN LIGHT (professional)
  light: { mode:"light", bg:"#F5F6F9", card:"#FFFFFF", border:"#ECEEF2", text:"#1A1D26", sub:"#6B7280", faint:"#AEB4C0", input:"#FFFFFF", nav:"#FFFFFF", soft:"#EFF1F4",
           accent:"#2F54EB", accent2:"#F59E0B", accent2Text:"#1A1208",
           fontDisplay:"'Plus Jakarta Sans',system-ui,sans-serif", fontBody:"'Plus Jakarta Sans',system-ui,sans-serif",
           cardBd:"#ECEEF2", cardBdW:"1px", radius:14, cardShadow:"0 1px 2px rgba(20,30,60,.05)", cardHover:"0 10px 28px rgba(20,30,60,.10)",
           a08:"#2F54EB14", a12:"#2F54EB1f", a14:"#2F54EB24", a15:"#2F54EB26", a20:"#2F54EB33", a30:"#2F54EB4d", a40:"#2F54EB66", a55:"#2F54EB8c" },
};

// ═══════════════ HELPERS ═══════════════
function useCountdown(initial, onEnd, running){
  const [t,setT]=useState(initial); const r=useRef(null); const cb=useRef(onEnd); cb.current=onEnd;
  useEffect(()=>{ if(!running){clearInterval(r.current);return;} r.current=setInterval(()=>setT(x=>{if(x<=1){clearInterval(r.current);cb.current?.();return 0;}return x-1;}),1000); return()=>clearInterval(r.current); },[running]);
  const reset=useCallback(v=>{clearInterval(r.current);setT(v??initial);},[initial]);
  return [t,reset];
}
function shuffleArr(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=a[i];a[i]=a[j];a[j]=t; } return a; }
function shuffleQOpts(q){
  if(!Array.isArray(q.o)||q.o.length<2)return q;
  // "barchasi/hammasi/yuqoridagi" kabi tartibga bog'liq variantlarni aralashtirmaymiz
  if(q.o.some(o=>/barcha|hamma|yuqorida|to'g'ri javob yo'q|hech qaysi/i.test(String(o))))return q;
  const perm=shuffleArr([...Array(q.o.length).keys()]);
  const o=perm.map(i=>q.o[i]);
  const a=Array.isArray(q.a)?q.a.map(x=>perm.indexOf(x)):perm.indexOf(q.a);
  return {...q,o,a};
}
function buildQs(ids, counts, bank){
  const list=[];
  ids.forEach((sid,i)=>{ const all=bank[sid]||[]; const c=counts?Math.min(counts[i],all.length):all.length; shuffleArr(all).slice(0,c).forEach(q=>list.push(shuffleQOpts({...q,subjectId:sid}))); });
  return list;
}
const fmtTime=s=>{const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),x=s%60;return h>0?`${h}:${String(m).padStart(2,"0")}:${String(x).padStart(2,"0")}`:`${String(m).padStart(2,"0")}:${String(x).padStart(2,"0")}`;};
// ── Telefon raqam (SMS'siz) ──
const PHONE_DOMAIN="@phone.quizmanga.uz";
const phoneDigits=v=>{let d=(v||"").replace(/\D/g,""); if(d.length===9)d="998"+d; return d;};
const isValidPhone=v=>{const d=phoneDigits(v); return d.length===12 && d.startsWith("998");};
const phoneToEmail=v=>phoneDigits(v)+PHONE_DOMAIN;
const fmtPhone=d=>{ if(!d)return ""; if(d.startsWith("998")&&d.length===12){const r=d.slice(3);return `+998 ${r.slice(0,2)} ${r.slice(2,5)} ${r.slice(5,7)} ${r.slice(7,9)}`;} return "+"+d; };
// Texnik emaildan telefon raqamni chiqarish (eski email akkauntlar uchun emailni o'zini qaytaradi)
const displayId=email=>{ if(email&&email.endsWith(PHONE_DOMAIN))return fmtPhone(email.split("@")[0]); return email||""; };
// Kirishda: agar @ bo'lsa email, aks holda telefon
const loginToEmail=v=>v && v.includes("@") ? v.trim() : phoneToEmail(v);
const grade=p=>p>=90?"A+":p>=80?"A":p>=70?"B":p>=60?"C":p>=50?"D":"F";
const gColor=p=>p>=70?"#00C896":p>=50?"#FF8C00":"var(--accent)";
const sObj=id=>SUBJECTS.find(s=>s.id===id);
let _id=0; const newId=()=>`x_${Date.now().toString(36)}_${(_id++).toString(36)}`;
const buildInitialBank=()=>{const b={};Object.entries(Q_INIT).forEach(([k,qs])=>b[+k]=qs.map((q,i)=>({...q,id:`init_${k}_${i}`})));return b;};

// ═══════════════ Supabase qator <-> app shaklini moslash ═══════════════
const rowToQ = r => ({ id:r.id, subjectId:r.subject_id, q:r.q, o:r.options, a:r.answer, multi:r.multi, diff:r.diff, topic:r.topic, exp:r.exp });
const qToRow = q => ({ subject_id:q.subjectId??q.subject_id, q:q.q, options:q.o, answer:q.a, multi:!!q.multi, diff:q.diff, topic:q.topic||"", exp:q.exp||"" });
const groupBank = rows => { const b={}; SUBJECTS.forEach(s=>b[s.id]=[]); (rows||[]).forEach(r=>{ const m=rowToQ(r); (b[m.subjectId]=b[m.subjectId]||[]).push(m); }); return b; };
const rowToTest = r => ({ id:r.id, title:r.title, icon:r.icon, color:r.color, desc:r.descr, subjects:r.subjects, counts:r.counts, timeMin:r.time_min });
const testToRow = t => ({ title:t.title, icon:t.icon, color:t.color, descr:t.desc||"", subjects:t.subjects, counts:t.counts, time_min:t.timeMin });
const isCorrect=(q,ans)=>{ if(q.multi){const c=[...q.a].sort().join(","); const a=[...(ans||[])].sort().join(","); return c===a;} return ans===q.a; };

// Sound via Web Audio
function useSound(){
  const ctxRef=useRef(null);
  const play=useCallback((type,muted)=>{
    if(muted) return;
    try{
      if(!ctxRef.current) ctxRef.current=new (window.AudioContext||window.webkitAudioContext)();
      const ctx=ctxRef.current; const o=ctx.createOscillator(); const g=ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      const cfg={correct:[660,880],wrong:[220,160],click:[440,440],win:[523,784],done:[392,587]}[type]||[440,440];
      o.frequency.setValueAtTime(cfg[0],ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(cfg[1],ctx.currentTime+.12);
      g.gain.setValueAtTime(.12,ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.22);
      o.start(); o.stop(ctx.currentTime+.22);
    }catch(e){}
  },[]);
  return play;
}

// ═══════════════ CSS (theme-aware design system) ═══════════════
function buildCSS(th){
  return `
  *{box-sizing:border-box;}
  :root{--accent:${th.accent};--accent2:${th.accent2};--accent2Text:${th.accent2Text};--a08:${th.a08};--a12:${th.a12};--a14:${th.a14};--a15:${th.a15};--a20:${th.a20};--a30:${th.a30};--a40:${th.a40};--a55:${th.a55};--font-display:${th.fontDisplay};--font-body:${th.fontBody};--bg:${th.bg};--card:${th.card};--border:${th.border};--text:${th.text};--sub:${th.sub};--soft:${th.soft};}
  @keyframes fIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes sIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
  @keyframes pop{0%{transform:scale(.94);opacity:0}60%{transform:scale(1.01)}100%{transform:scale(1);opacity:1}}
  @keyframes fall{to{transform:translateY(105vh) rotate(720deg);opacity:0}}
  @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
  @keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes growW{from{width:0}}
  h1,h2,h3{font-family:var(--font-display)!important;letter-spacing:-.4px;}
  .brand{font-family:var(--font-display)!important;font-weight:800;letter-spacing:-.5px;}
  .mb{cursor:pointer;font-family:var(--font-display);font-weight:600;border-width:1px;border-style:solid;transition:transform .14s ease,box-shadow .14s ease,filter .15s,background .15s;}
  .mb:hover:not(:disabled){transform:translateY(-1px);box-shadow:${th.cardHover};}
  .mb:active:not(:disabled){transform:translateY(0);box-shadow:none;}
  .mb:disabled{opacity:.45;cursor:not-allowed;}
  .card{background:${th.card};border:1px solid ${th.cardBd};border-radius:${th.radius}px;box-shadow:${th.cardShadow};transition:transform .16s ease,box-shadow .16s ease,border-color .18s;}
  .ch:hover{transform:translateY(-2px);box-shadow:${th.cardHover};border-color:${th.faint};}
  .opt{cursor:pointer;border:1px solid ${th.cardBd};background:${th.input};color:${th.sub};padding:13px 16px;border-radius:11px;text-align:left;font-size:14px;transition:all .14s;display:block;width:100%;margin-bottom:9px;line-height:1.4;font-family:var(--font-body);}
  .opt:hover{border-color:var(--accent);color:${th.text};background:var(--a08);}
  .osel{border-color:var(--accent)!important;background:var(--a12)!important;color:${th.text}!important;box-shadow:inset 0 0 0 1px var(--accent);}
  input,textarea,select{background:${th.input}!important;border:1px solid ${th.cardBd}!important;color:${th.text}!important;padding:11px 13px!important;border-radius:10px!important;font-size:13px!important;outline:none!important;transition:border-color .15s,box-shadow .15s!important;font-family:var(--font-body)!important;width:100%;}
  input:focus,textarea:focus,select:focus{border-color:var(--accent)!important;box-shadow:0 0 0 3px var(--a15)!important;}
  textarea{resize:vertical!important;min-height:70px!important;}
  select option{background:${th.card};color:${th.text};}
  .tag{font-size:11px;font-weight:600;padding:3px 10px;border-radius:8px;display:inline-block;font-family:var(--font-body);}
  .proBadge{background:var(--accent2);color:var(--accent2Text);font-size:10px;font-weight:700;padding:3px 9px;border-radius:6px;letter-spacing:.4px;font-family:var(--font-display);}
  .adminBadge{background:var(--accent);color:#fff;font-size:10px;font-weight:700;padding:3px 9px;border-radius:6px;letter-spacing:.4px;font-family:var(--font-display);}
  ::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${th.faint};border-radius:3px}
  .appHeader{display:flex;align-items:center;gap:8px;}
  @media(max-width:680px){
    .hideMob{display:none!important;}
    .gridMob{grid-template-columns:1fr 1fr!important;}
    .appHeader{flex-wrap:wrap;row-gap:8px;}
    .padMob{padding-left:14px!important;padding-right:14px!important;}
    h2{font-size:20px!important;}
    .adminSidebar{position:static!important;width:100%!important;height:auto!important;flex-direction:row!important;overflow-x:auto!important;border-right:none!important;border-bottom:1px solid var(--border)!important;}
    .adminMain{padding:14px!important;}
  }
  @media(max-width:440px){
    .gridMob{grid-template-columns:1fr!important;}
  }`;}

// Confetti
function Confetti(){
  const colors=["#2F54EB","#16A34A","#F59E0B","#EF4444","#8B5CF6","#06B6D4"];
  const bits=Array.from({length:44},(_,i)=>({id:i,x:Math.random()*100,c:colors[i%colors.length],d:Math.random()*2+1.5,delay:Math.random()*.6,size:Math.random()*8+5}));
  return <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:9998,overflow:"hidden"}}>
    {bits.map(b=><div key={b.id} style={{position:"absolute",left:`${b.x}%`,top:-20,width:b.size,height:b.size,background:b.c,borderRadius:Math.random()>.5?"50%":"2px",animation:`fall ${b.d}s ${b.delay}s ease-in forwards`}} />)}
  </div>;
}

// ═══════════════ ADMIN PANEL ═══════════════
function AdminPanel({qBank,setQBank,customTests,setCustomTests,users,setUsers,testHistory,onBack,th,t}){
  const [view,setView]=useState("stats");
  const [selSid,setSelSid]=useState(1);
  const [modal,setModal]=useState(null);
  const [del,setDel]=useState(null);
  const [qForm,setQForm]=useState({subjectId:1,q:"",o:["","","",""],a:0,multi:false,diff:"easy",topic:"",exp:""});
  const [testForm,setTestForm]=useState({title:"",icon:"🎯",color:"#4F6EF7",subs:{},timeMin:30,desc:""});
  const [editTestIdx,setEditTestIdx]=useState(null);
  const [search,setSearch]=useState("");
  const [diffFilter,setDiffFilter]=useState("all");
  const [importText,setImportText]=useState("");
  const [toast,setToast]=useState(null);
  const [allResults,setAllResults]=useState([]);
  const [uSearch,setUSearch]=useState("");
  useEffect(()=>{ rApi.listAll().then(setAllResults).catch(()=>{}); },[]);
  const [promos,setPromos]=useState([]);
  const [anns2,setAnns2]=useState([]);
  const [pForm,setPForm]=useState({code:"",days:30,max:0});
  const [aForm,setAForm]=useState({title:"",body:""});
  useEffect(()=>{ promoApi.list().then(setPromos).catch(()=>{}); annApi.list().then(setAnns2).catch(()=>{}); },[]);
  const notify=(m,ty="ok")=>{setToast({m,ty});setTimeout(()=>setToast(null),2600);};
  const addPromo=async()=>{ const code=pForm.code.trim().toUpperCase(); if(!code)return notify("Kod kiriting","err"); try{ await promoApi.create({code,days:+pForm.days||30,max_uses:+pForm.max||0}); setPForm({code:"",days:30,max:0}); setPromos(await promoApi.list()); notify("Promokod yaratildi ✓"); }catch(e){ notify(e.message||"Xato","err"); } };
  const rmPromo=async code=>{ try{ await promoApi.remove(code); setPromos(p=>p.filter(x=>x.code!==code)); notify("O'chirildi","warn"); }catch(e){ notify(e.message||"Xato","err"); } };
  const addAnn=async()=>{ if(!aForm.title.trim())return notify("Sarlavha kiriting","err"); try{ await annApi.create(aForm.title.trim(),aForm.body.trim()); setAForm({title:"",body:""}); setAnns2(await annApi.list()); notify("E'lon joylandi ✓"); }catch(e){ notify(e.message||"Xato","err"); } };
  const rmAnn=async id=>{ try{ await annApi.remove(id); setAnns2(a=>a.filter(x=>x.id!==id)); notify("O'chirildi","warn"); }catch(e){ notify(e.message||"Xato","err"); } };
  const grantPro=async(id,days)=>{
    const until=new Date(Date.now()+days*86400000).toISOString();
    try{ await pApi.setPlan(id,"pro",until); setUsers(us=>us.map(u=>u.id===id?{...u,plan:"pro",pro_until:until}:u)); notify(`PRO ${days} kunga berildi ✓`); }
    catch(e){ notify(e.message||"Xato","err"); }
  };
  const revokePro=async id=>{ try{ await pApi.setPlan(id,"free",null); setUsers(us=>us.map(u=>u.id===id?{...u,plan:"free",pro_until:null}:u)); notify("PRO bekor qilindi","warn"); }catch(e){ notify(e.message||"Xato","err"); } };
  const changeRole=async(id,role)=>{ try{ await pApi.setRole(id,role); setUsers(us=>us.map(u=>u.id===id?{...u,role}:u)); notify("Rol o'zgartirildi ✓"); }catch(e){ notify(e.message||"Xato","err"); } };
  const uTestCount=id=>allResults.filter(r=>r.user_id===id).length;
  const proCount=users.filter(u=>u.plan==="pro"&&(!u.pro_until||new Date(u.pro_until)>new Date())).length;

  const totalQ=Object.values(qBank).reduce((a,c)=>a+c.length,0);
  const selSubj=sObj(selSid);
  const list=(qBank[selSid]||[]).filter(q=>(!search||q.q.toLowerCase().includes(search.toLowerCase()))&&(diffFilter==="all"||q.diff===diffFilter));

  const openAdd=()=>{setQForm({subjectId:selSid,q:"",o:["","","",""],a:0,multi:false,diff:"easy",topic:selSubj.topics[0],exp:""});setModal({mode:"add"});};
  const openEdit=idx=>{const q=qBank[selSid][idx];setQForm({subjectId:selSid,q:q.q,o:[...q.o],a:q.multi?[...q.a]:q.a,multi:!!q.multi,diff:q.diff||"easy",topic:q.topic||"",exp:q.exp||""});setModal({mode:"edit",idx});};
  const toggleMulti=()=>setQForm(f=>({...f,multi:!f.multi,a:f.multi?0:[]}));
  const toggleAnswer=i=>{ if(qForm.multi){setQForm(f=>{const a=f.a.includes(i)?f.a.filter(x=>x!==i):[...f.a,i];return{...f,a};});} else setQForm(f=>({...f,a:i})); };
  const saveQ=async()=>{
    if(!qForm.q.trim())return notify("Savol matnini kiriting!","err");
    if(qForm.o.some(o=>!o.trim()))return notify("Barcha variantlarni to'ldiring!","err");
    if(qForm.multi&&!qForm.a.length)return notify("Kamida 1 to'g'ri javob!","err");
    const obj={q:qForm.q,o:qForm.o,a:qForm.a,multi:qForm.multi,diff:qForm.diff,topic:qForm.topic,exp:qForm.exp,subjectId:selSid};
    try{
      if(modal.mode==="add"){
        const saved=rowToQ(await qApi.add(qToRow(obj)));
        setQBank(b=>({...b,[selSid]:[...(b[selSid]||[]),saved]}));notify("Savol qo'shildi ✓");
      }else{
        const id=qBank[selSid][modal.idx].id;
        const saved=rowToQ(await qApi.update(id,qToRow(obj)));
        setQBank(b=>{const a=[...(b[selSid]||[])];a[modal.idx]=saved;return{...b,[selSid]:a};});notify("Yangilandi ✓");
      }
      setModal(null);
    }catch(e){ notify(e.message||"Saqlashda xato","err"); }
  };
  const confirmDel=async()=>{
    try{ const id=qBank[del.sid][del.idx].id; await qApi.remove(id);
      setQBank(b=>{const a=[...(b[del.sid]||[])];a.splice(del.idx,1);return{...b,[del.sid]:a};});notify("O'chirildi","warn");
    }catch(e){ notify(e.message||"O'chirishda xato","err"); }
    setDel(null);
  };

  const doImport=async()=>{
    const lines=importText.trim().split("\n").filter(l=>l.trim());
    const rows=[];
    lines.forEach(line=>{
      const p=line.split(/[;,]/).map(x=>x.trim());
      if(p.length>=6){
        const correct=parseInt(p[5])-1;
        if(p[0]&&!isNaN(correct)&&correct>=0&&correct<4){
          rows.push(qToRow({q:p[0],o:[p[1],p[2],p[3],p[4]],a:correct,multi:false,diff:p[6]||"easy",topic:p[7]||selSubj.topics[0],exp:p[8]||"",subjectId:selSid}));
        }
      }
    });
    if(!rows.length)return notify("Format xato! Namunaga qarang","err");
    try{
      const saved=(await qApi.bulkAdd(rows)).map(rowToQ);
      setQBank(b=>({...b,[selSid]:[...(b[selSid]||[]),...saved]}));
      notify(`${saved.length} ta savol import qilindi ✓`);setImportText("");
    }catch(e){ notify(e.message||"Import xatosi","err"); }
  };

  const saveTest=async()=>{
    if(!testForm.title.trim())return notify("Test nomini kiriting!","err");
    const subs=Object.entries(testForm.subs).filter(([,v])=>v>0);
    if(!subs.length)return notify("Kamida 1 fan tanlang!","err");
    const test={title:testForm.title,icon:testForm.icon,color:testForm.color,desc:testForm.desc,subjects:subs.map(([id])=>+id),counts:subs.map(([,c])=>c),timeMin:testForm.timeMin};
    try{
      if(editTestIdx!==null){
        const id=customTests[editTestIdx].id;
        const saved=rowToTest(await tApi.update(id,testToRow(test)));
        setCustomTests(t=>{const a=[...t];a[editTestIdx]=saved;return a;});notify("Yangilandi ✓");
      }else{
        const saved=rowToTest(await tApi.add(testToRow(test)));
        setCustomTests(t=>[...t,saved]);notify("Saqlandi ✓");
      }
      setTestForm({title:"",icon:"🎯",color:"#4F6EF7",subs:{},timeMin:30,desc:""});setEditTestIdx(null);
    }catch(e){ notify(e.message||"Saqlashda xato","err"); }
  };
  const editTest=i=>{const t=customTests[i];const subs={};t.subjects.forEach((sid,j)=>subs[sid]=t.counts[j]);setTestForm({title:t.title,icon:t.icon||"🎯",color:t.color||"#4F6EF7",desc:t.desc||"",subs,timeMin:t.timeMin||30});setEditTestIdx(i);setView("builder");};

  const exportResults=()=>{
    const nameOf=id=>{const u=users.find(x=>x.id===id);return u?u.name:"—";};
    const emailOf=id=>{const u=users.find(x=>x.id===id);return u?displayId(u.email)||"—":"—";};
    const rows=[["Foydalanuvchi","Telefon","Test","Ball","Jami","Foiz","Sana"]];
    allResults.forEach(r=>rows.push([nameOf(r.user_id),emailOf(r.user_id),r.title,r.score,r.total,r.pct+"%",new Date(r.created_at).toLocaleDateString("uz-UZ")]));
    users.forEach(u=>{ if(!allResults.some(r=>r.user_id===u.id)) rows.push([u.name,u.email||"—","—","—","—","—","—"]); });
    const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="natijalar.csv";a.click();URL.revokeObjectURL(url);
    notify("CSV yuklab olindi ✓");
  };
  const toggleBlock=async id=>{
    const u=users.find(x=>x.id===id); if(!u)return;
    try{ await pApi.setBlocked(id,!u.blocked); setUsers(us=>us.map(x=>x.id===id?{...x,blocked:!x.blocked}:x)); notify(u.blocked?"Blok ochildi":"Bloklandi","warn"); }
    catch(e){ notify(e.message||"Xato","err"); }
  };
  const seedDemo=async()=>{
    if(!window.confirm("110 ta demo savol bazaga qo'shilsinmi? (faqat bo'sh baza uchun tavsiya etiladi)"))return;
    try{
      const rows=[];
      Object.entries(Q_INIT).forEach(([sid,qs])=>qs.forEach(q=>rows.push(qToRow({...q,subjectId:+sid}))));
      const saved=(await qApi.bulkAdd(rows)).map(rowToQ);
      const b={};SUBJECTS.forEach(s=>b[s.id]=[]);saved.forEach(m=>b[m.subjectId].push(m));setQBank(b);
      notify(`${saved.length} demo savol qo'shildi ✓`);
    }catch(e){ notify(e.message||"Xato","err"); }
  };

  const SIDEBAR=[["stats","📊","Ko'rsatkichlar"],["questions","❓","Savollar"],["import","📥","Import"],["builder","🧪","Test Yaratish"],["tests","📋","Testlar"],["users","👥","Foydalanuvchilar"],["manage","🎁","Boshqaruv"]];
  const icons=["🎯","🔥","⚡","🏆","💡","🧠","🎓","📝","🌟","💎"];
  const cols=["#4F6EF7","var(--accent)","#00C896","#FF8C00","#9C27B0","#E91E8C","#00B4D8","#1A85FF"];
  const C={background:th.card,border:`${th.cardBdW} solid ${th.cardBd}`,borderRadius:th.radius,boxShadow:th.cardShadow};

  return (
    <div style={{display:"flex",minHeight:"100vh",background:th.bg,color:th.text,fontFamily:"var(--font-body)"}}>
      <style>{buildCSS(th)}</style>
      {toast&&<div style={{position:"fixed",top:18,right:18,zIndex:9999,background:toast.ty==="err"?"#C0392B":toast.ty==="warn"?"#FF8C00":"#00C896",color:"#fff",padding:"10px 20px",borderRadius:8,fontWeight:700,fontSize:13,animation:"sIn .3s ease",boxShadow:"0 4px 20px rgba(0,0,0,.3)"}}>{toast.m}</div>}

      {del&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}}><div style={{...C,padding:"2rem",maxWidth:360,textAlign:"center",animation:"pop .25s",borderColor:"var(--a40)"}}><div style={{fontSize:38,marginBottom:10}}>🗑️</div><div style={{fontWeight:800,fontSize:15,marginBottom:6}}>Savolni o'chirish?</div><div style={{color:th.sub,fontSize:13,marginBottom:20}}>Qaytarib bo'lmaydi.</div><div style={{display:"flex",gap:10,justifyContent:"center"}}><button className="mb" onClick={()=>setDel(null)} style={{background:"transparent",color:th.text,borderColor:th.border,padding:"9px 20px",fontSize:12,borderRadius:7}}>BEKOR</button><button className="mb" onClick={confirmDel} style={{background:"var(--accent)",color:"#fff",borderColor:"var(--accent)",padding:"9px 20px",fontSize:12,borderRadius:7}}>O'CHIRISH</button></div></div></div>}

      {modal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:998,padding:"1rem"}}><div style={{...C,width:"100%",maxWidth:540,animation:"pop .25s",borderColor:"#4F6EF740",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{padding:"1.4rem 1.5rem",borderBottom:`1px solid ${th.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontWeight:900,fontSize:16}}>{modal.mode==="add"?"Yangi Savol":"Savolni Tahrirlash"}</div><button onClick={()=>setModal(null)} style={{background:"none",border:"none",color:th.sub,cursor:"pointer",fontSize:22}}>×</button></div>
        <div style={{padding:"1.5rem"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
            <div><label style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700,display:"block",marginBottom:5}}>FAN</label><select value={qForm.subjectId} onChange={e=>setQForm(f=>({...f,subjectId:+e.target.value,topic:sObj(+e.target.value).topics[0]}))}>{SUBJECTS.map(s=><option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}</select></div>
            <div><label style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700,display:"block",marginBottom:5}}>QIYINLIK</label><select value={qForm.diff} onChange={e=>setQForm(f=>({...f,diff:e.target.value}))}>{Object.entries(DIFF).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></div>
          </div>
          <div style={{marginBottom:14}}><label style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700,display:"block",marginBottom:5}}>MAVZU</label><select value={qForm.topic} onChange={e=>setQForm(f=>({...f,topic:e.target.value}))}>{(sObj(qForm.subjectId)?.topics||[]).map(tp=><option key={tp} value={tp}>{tp}</option>)}</select></div>
          <div style={{marginBottom:14}}><label style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700,display:"block",marginBottom:5}}>SAVOL MATNI</label><textarea value={qForm.q} onChange={e=>setQForm(f=>({...f,q:e.target.value}))} placeholder="Savolni kiriting..." /></div>
          <div style={{marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <label style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700}}>JAVOB VARIANTLARI</label>
            <label style={{fontSize:11,color:qForm.multi?"#4F6EF7":th.sub,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><input type="checkbox" checked={qForm.multi} onChange={toggleMulti} style={{width:"auto",accentColor:"#4F6EF7"}} />Ko'p javobli</label>
          </div>
          {qForm.o.map((opt,i)=>{const sel=qForm.multi?qForm.a.includes(i):qForm.a===i;return(
            <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
              <div onClick={()=>toggleAnswer(i)} style={{width:26,height:26,borderRadius:qForm.multi?6:"50%",background:sel?"#00C896":th.soft,border:`1.5px solid ${sel?"#00C896":th.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0,cursor:"pointer",color:sel?"#fff":th.sub,transition:"all .12s"}}>{sel?"✓":String.fromCharCode(65+i)}</div>
              <input value={opt} onChange={e=>{const o=[...qForm.o];o[i]=e.target.value;setQForm(f=>({...f,o}));}} placeholder={`${i+1}-variant...`} />
            </div>
          );})}
          <div style={{fontSize:10,color:"#4F6EF7",marginTop:2,marginBottom:14}}>● To'g'ri javob(lar)ni belgilang</div>
          <div style={{marginBottom:16}}><label style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700,display:"block",marginBottom:5}}>IZOH (tahlil rejimi uchun)</label><input value={qForm.exp} onChange={e=>setQForm(f=>({...f,exp:e.target.value}))} placeholder="To'g'ri javob izohi..." /></div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button className="mb" onClick={()=>setModal(null)} style={{background:"transparent",color:th.text,borderColor:th.border,padding:"10px 20px",fontSize:12,borderRadius:7}}>BEKOR</button><button className="mb" onClick={saveQ} style={{background:"#4F6EF7",color:"#fff",borderColor:"#4F6EF7",padding:"10px 20px",fontSize:12,borderRadius:7}}>SAQLASH ✓</button></div>
        </div>
      </div></div>}

      {/* Sidebar */}
      <div style={{width:210,background:th.nav,borderRight:`1px solid ${th.border}`,display:"flex",flexDirection:"column",flexShrink:0}} className="hideMob">
        <div style={{padding:"1.2rem 1.4rem",borderBottom:`1px solid ${th.border}`}}><div className="brand" style={{fontWeight:900,fontSize:15}}>Fanlar<span style={{color:"#4F6EF7"}}>Edu</span></div><span className="adminBadge" style={{marginTop:5,display:"inline-block"}}>ADMIN</span></div>
        <nav style={{flex:1,padding:".6rem 0"}}>{SIDEBAR.map(([id,ic,lb])=><div key={id} onClick={()=>setView(id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 1.4rem",cursor:"pointer",background:view===id?"#4F6EF715":"transparent",borderLeft:`3px solid ${view===id?"#4F6EF7":"transparent"}`,fontSize:13,fontWeight:view===id?800:500,color:view===id?"#A0B4FF":th.sub,transition:"all .15s"}}><span style={{fontSize:16}}>{ic}</span>{lb}</div>)}</nav>
        <div style={{padding:"1rem 1.4rem",borderTop:`1px solid ${th.border}`}}><button className="mb" onClick={onBack} style={{width:"100%",background:"transparent",color:th.sub,borderColor:th.border,padding:"9px",fontSize:11,borderRadius:7}}>← QAYTISH</button></div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"1.5rem"}}>
        {/* Mobile nav */}
        <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto"}} className="hideMobInv">{SIDEBAR.map(([id,ic,lb])=><div key={id} onClick={()=>setView(id)} style={{padding:"7px 12px",borderRadius:8,background:view===id?"#4F6EF720":th.soft,color:view===id?"#4F6EF7":th.sub,fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",border:`1px solid ${view===id?"#4F6EF740":th.border}`}}>{ic} {lb}</div>)}</div>

        {/* STATS */}
        {view==="stats"&&<div style={{animation:"fIn .3s"}}>
          <h2 style={{fontSize:24,fontWeight:900,margin:"0 0 1.5rem"}}>📊 Ko'rsatkichlar</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:24}} className="gridMob">
            {[["Jami savollar",totalQ,"#4F6EF7","❓"],["Foydalanuvchilar",users.length,"var(--accent)","👥"],["PRO obunachilar",proCount,"#FFD700","⭐"],["O'tilgan testlar",allResults.length,"#FF8C00","📝"]].map(([l,v,c,ic])=><div key={l} style={{...C,padding:"1.1rem",borderLeft:`3px solid ${c}`}}><div style={{fontSize:20}}>{ic}</div><div style={{fontSize:26,fontWeight:900,color:c,marginTop:3}}>{v}</div><div style={{fontSize:11,color:th.sub,marginTop:2}}>{l}</div></div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}} className="gridMob">
            <div style={{...C,padding:"1.4rem"}}><div style={{fontSize:10,color:th.sub,letterSpacing:3,fontWeight:700,marginBottom:14}}>FANLAR BO'YICHA SAVOLLAR</div>{SUBJECTS.map(s=>{const cnt=(qBank[s.id]||[]).length;return<div key={s.id} style={{display:"flex",alignItems:"center",gap:9,marginBottom:9}}><span style={{fontSize:15,width:20}}>{s.icon}</span><div style={{fontSize:12,width:88,color:th.sub}}>{s.name}</div><div style={{flex:1,background:th.soft,borderRadius:4,height:6,overflow:"hidden"}}><div style={{height:"100%",width:`${(cnt/25)*100}%`,background:s.color,borderRadius:4}} /></div><div style={{fontSize:12,fontWeight:700,color:s.color,width:24,textAlign:"right"}}>{cnt}</div></div>;})}</div>
            <div style={{...C,padding:"1.4rem"}}><div style={{fontSize:10,color:th.sub,letterSpacing:3,fontWeight:700,marginBottom:14}}>TEZKOR HARAKATLAR</div><div style={{display:"flex",flexDirection:"column",gap:9}}>{[["questions","#4F6EF7","❓ Savol qo'shish"],["import","#9C27B0","📥 CSV import"],["builder","#00C896","🧪 Test yaratish"],["users","#FF8C00","👥 Foydalanuvchilar"]].map(([v,c,l])=><button key={v} className="mb" onClick={()=>setView(v)} style={{background:c+"15",color:c,borderColor:c+"30",padding:"11px",fontSize:12,borderRadius:8,textAlign:"left"}}>{l} →</button>)}<button className="mb" onClick={exportResults} style={{background:"var(--a15)",color:"var(--accent)",borderColor:"var(--a30)",padding:"11px",fontSize:12,borderRadius:8,textAlign:"left"}}>📤 Natijalarni eksport (CSV) →</button><button className="mb" onClick={seedDemo} style={{background:"#1A85FF15",color:"#1A85FF",borderColor:"#1A85FF30",padding:"11px",fontSize:12,borderRadius:8,textAlign:"left"}}>🌱 Demo savollarni yuklash ({Object.values(Q_INIT).reduce((a,qs)=>a+qs.length,0)} ta) →</button></div></div>
          </div>
        </div>}

        {/* QUESTIONS */}
        {view==="questions"&&<div style={{animation:"fIn .3s"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}><h2 style={{fontSize:20,fontWeight:900,margin:0}}>❓ Savol Banki</h2><button className="mb" onClick={openAdd} style={{background:"#4F6EF7",color:"#fff",borderColor:"#4F6EF7",padding:"10px 18px",fontSize:12,borderRadius:8}}>+ YANGI SAVOL</button></div>
          <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>{SUBJECTS.map(s=><div key={s.id} onClick={()=>{setSelSid(s.id);setSearch("");}} style={{padding:"6px 13px",borderRadius:20,border:`1.5px solid ${selSid===s.id?s.color:th.border}`,background:selSid===s.id?s.color+"20":"transparent",color:selSid===s.id?s.color:th.sub,fontSize:12,fontWeight:700,cursor:"pointer"}}>{s.icon} {s.short} <span style={{fontSize:10,opacity:.7}}>({(qBank[s.id]||[]).length})</span></div>)}</div>
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Qidirish..." style={{flex:1,minWidth:160}} />
            <select value={diffFilter} onChange={e=>setDiffFilter(e.target.value)} style={{width:"auto"}}><option value="all">Barcha qiyinlik</option>{Object.entries(DIFF).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select>
          </div>
          <div style={{...C,overflow:"hidden"}}>
            <div style={{padding:"11px 16px",borderBottom:`1px solid ${th.border}`,display:"flex",alignItems:"center",gap:8,background:th.soft}}><span style={{fontSize:17}}>{selSubj?.icon}</span><span style={{fontWeight:800,fontSize:14}}>{selSubj?.name}</span><span style={{marginLeft:"auto",fontSize:12,color:th.sub}}>{list.length} ta</span></div>
            {list.length===0?<div style={{padding:"3rem",textAlign:"center",color:th.faint}}><div style={{fontSize:38,marginBottom:8}}>📭</div>Savol topilmadi</div>:list.map((q,i)=>{const ri=(qBank[selSid]||[]).indexOf(q);return(
              <div key={q.id||i} style={{padding:"13px 16px",borderBottom:i<list.length-1?`1px solid ${th.border}`:"none",display:"flex",gap:11,alignItems:"flex-start"}}>
                <div style={{width:26,height:26,borderRadius:7,background:selSubj?.color+"18",color:selSubj?.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0}}>{i+1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",gap:6,marginBottom:5,flexWrap:"wrap",alignItems:"center"}}>
                    <span className="tag" style={{background:DIFF[q.diff]?.color+"20",color:DIFF[q.diff]?.color,fontSize:10}}>{DIFF[q.diff]?.label}</span>
                    {q.topic&&<span className="tag" style={{background:th.soft,color:th.sub,fontSize:10}}>{q.topic}</span>}
                    {q.multi&&<span className="tag" style={{background:"#4F6EF720",color:"#4F6EF7",fontSize:10}}>Ko'p javobli</span>}
                  </div>
                  <div style={{fontSize:14,fontWeight:600,marginBottom:6,lineHeight:1.4}}>{q.q}</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{q.o.map((opt,j)=>{const ok=q.multi?q.a.includes(j):q.a===j;return<span key={j} style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:ok?"#00C89620":th.soft,border:`1px solid ${ok?"#00C89640":th.border}`,color:ok?"#00C896":th.sub,fontWeight:ok?700:400}}>{String.fromCharCode(65+j)}: {opt}</span>;})}</div>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}><button className="mb" onClick={()=>openEdit(ri)} style={{background:"#4F6EF715",color:"#A0B4FF",borderColor:"#4F6EF730",padding:"6px 11px",fontSize:11,borderRadius:6}}>✏️</button><button className="mb" onClick={()=>setDel({sid:selSid,idx:ri})} style={{background:"var(--a12)",color:"var(--accent)",borderColor:"var(--a30)",padding:"6px 11px",fontSize:11,borderRadius:6}}>🗑️</button></div>
              </div>
            );})}
          </div>
        </div>}

        {/* IMPORT */}
        {view==="import"&&<div style={{animation:"fIn .3s",maxWidth:640}}>
          <h2 style={{fontSize:20,fontWeight:900,margin:"0 0 6px"}}>📥 Savollarni Import qilish</h2>
          <p style={{color:th.sub,fontSize:13,marginBottom:16}}>CSV formatda ommaviy savol qo'shing</p>
          <div style={{...C,padding:"1.4rem",marginBottom:14}}>
            <label style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700,display:"block",marginBottom:8}}>QAYSI FANGA?</label>
            <select value={selSid} onChange={e=>setSelSid(+e.target.value)} style={{marginBottom:14}}>{SUBJECTS.map(s=><option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}</select>
            <label style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700,display:"block",marginBottom:8}}>CSV MA'LUMOT</label>
            <textarea value={importText} onChange={e=>setImportText(e.target.value)} placeholder="savol; variant1; variant2; variant3; variant4; to'g'ri_raqam; qiyinlik; mavzu; izoh" style={{minHeight:160,fontFamily:"monospace"}} />
            <div style={{background:th.soft,borderRadius:8,padding:"12px",marginTop:12,fontSize:11,color:th.sub,lineHeight:1.7}}>
              <b style={{color:"#4F6EF7"}}>Namuna:</b><br/>
              <code style={{color:th.text}}>5+5 nechiga teng?; 8; 9; 10; 11; 3; easy; Algebra; 5+5=10</code><br/>
              <span style={{fontSize:10}}>• Har savol yangi qatorda • to'g'ri_raqam: 1-4 • qiyinlik: easy/medium/hard</span>
            </div>
            <button className="mb" onClick={doImport} style={{width:"100%",marginTop:14,background:"#9C27B0",color:"#fff",borderColor:"#9C27B0",padding:"12px",fontSize:13,borderRadius:8}}>📥 IMPORT QILISH</button>
          </div>
        </div>}

        {/* BUILDER */}
        {view==="builder"&&<div style={{animation:"fIn .3s"}}>
          <h2 style={{fontSize:20,fontWeight:900,margin:"0 0 1.2rem"}}>🧪 {editTestIdx!==null?"Testni Tahrirlash":"Test Yaratish"}</h2>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}} className="gridMob">
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{...C,padding:"1.4rem"}}>
                <div style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700,marginBottom:12}}>MA'LUMOTLAR</div>
                <input value={testForm.title} onChange={e=>setTestForm(f=>({...f,title:e.target.value}))} placeholder="Test nomi *" style={{marginBottom:10}} />
                <input value={testForm.desc} onChange={e=>setTestForm(f=>({...f,desc:e.target.value}))} placeholder="Tavsif (ixtiyoriy)" style={{marginBottom:12}} />
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                  <div><label style={{fontSize:10,color:th.sub,fontWeight:700,display:"block",marginBottom:5}}>ICON</label><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{icons.map(ic=><div key={ic} onClick={()=>setTestForm(f=>({...f,icon:ic}))} style={{width:30,height:30,borderRadius:7,background:testForm.icon===ic?"#4F6EF730":th.soft,border:`1.5px solid ${testForm.icon===ic?"#4F6EF7":th.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,cursor:"pointer"}}>{ic}</div>)}</div></div>
                  <div><label style={{fontSize:10,color:th.sub,fontWeight:700,display:"block",marginBottom:5}}>RANG</label><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{cols.map(c=><div key={c} onClick={()=>setTestForm(f=>({...f,color:c}))} style={{width:25,height:25,borderRadius:"50%",background:c,border:`2.5px solid ${testForm.color===c?th.text:"transparent"}`,cursor:"pointer"}} />)}</div></div>
                </div>
                <label style={{fontSize:10,color:th.sub,fontWeight:700,display:"block",marginBottom:5}}>VAQT: {testForm.timeMin} daqiqa</label>
                <input type="range" min={5} max={180} step={5} value={testForm.timeMin} onChange={e=>setTestForm(f=>({...f,timeMin:+e.target.value}))} style={{accentColor:"#4F6EF7",border:"none",background:"transparent",padding:0}} />
              </div>
              <div style={{...C,padding:"1.4rem"}}>
                <div style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700,marginBottom:12}}>FANLAR VA SAVOLLAR</div>
                {SUBJECTS.map(s=>{const avail=qBank[s.id]?.length||0;const max=Math.min(avail,20);const val=testForm.subs[s.id]||0;return<div key={s.id} style={{display:"flex",alignItems:"center",gap:9,marginBottom:7,opacity:avail===0?.45:1}}><div style={{display:"flex",alignItems:"center",gap:5,width:130,flexShrink:0}}><span style={{fontSize:15}}>{s.icon}</span><span style={{fontSize:12,color:val>0?s.color:th.sub}}>{s.name}</span></div>{avail===0?<div style={{flex:1,fontSize:11,color:th.faint,fontStyle:"italic"}}>savol yo'q</div>:<input type="range" min={0} max={max} value={val} onChange={e=>setTestForm(f=>({...f,subs:{...f.subs,[s.id]:+e.target.value}}))} style={{flex:1,accentColor:s.color,border:"none",background:"transparent",padding:0}} />}<span style={{fontSize:12,fontWeight:800,color:val>0?s.color:th.faint,width:42,textAlign:"right"}}>{avail===0?"0":val?`${val}/${avail}`:`—/${avail}`}</span></div>;})}
              </div>
              <div style={{display:"flex",gap:10}}>{editTestIdx!==null&&<button className="mb" onClick={()=>{setEditTestIdx(null);setTestForm({title:"",icon:"🎯",color:"#4F6EF7",subs:{},timeMin:30,desc:""});}} style={{background:"transparent",color:th.sub,borderColor:th.border,padding:"12px 18px",fontSize:12,borderRadius:8}}>BEKOR</button>}<button className="mb" onClick={saveTest} style={{flex:1,background:"#4F6EF7",color:"#fff",borderColor:"#4F6EF7",padding:"13px",fontSize:13,borderRadius:8}}>{editTestIdx!==null?"YANGILASH ✓":"SAQLASH ✓"}</button></div>
            </div>
            <div><div style={{...C,padding:"1.4rem"}}>
              <div style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700,marginBottom:12}}>PREVIEW</div>
              {!testForm.title?<div style={{textAlign:"center",padding:"2rem",color:th.faint}}><div style={{fontSize:30,marginBottom:8}}>🧪</div>Ma'lumot kiriting</div>:<>
                <div style={{background:`linear-gradient(135deg,${testForm.color}18,${testForm.color}08)`,border:`1.5px solid ${testForm.color}30`,borderRadius:10,padding:"1.2rem",marginBottom:12}}><div style={{fontSize:30,marginBottom:8}}>{testForm.icon}</div><div style={{fontWeight:900,fontSize:16,marginBottom:4}}>{testForm.title}</div>{testForm.desc&&<div style={{fontSize:12,color:th.sub,marginBottom:8}}>{testForm.desc}</div>}<div style={{display:"flex",gap:6,flexWrap:"wrap"}}><span className="tag" style={{background:testForm.color+"18",color:testForm.color}}>⏱ {testForm.timeMin} daq</span><span className="tag" style={{background:th.soft,color:th.sub}}>{Object.values(testForm.subs).reduce((a,c)=>a+c,0)} savol</span></div></div>
                {Object.entries(testForm.subs).filter(([,v])=>v>0).map(([sid,c])=>{const s=sObj(+sid);return<div key={sid} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${th.border}`}}><span style={{fontSize:15}}>{s?.icon}</span><span style={{fontSize:12,flex:1,color:th.sub}}>{s?.name}</span><span style={{fontSize:12,fontWeight:700,color:s?.color}}>{c} savol</span></div>;})}
              </>}
            </div></div>
          </div>
        </div>}

        {/* TESTS LIST */}
        {view==="tests"&&<div style={{animation:"fIn .3s"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h2 style={{fontSize:20,fontWeight:900,margin:0}}>📋 Testlar</h2><button className="mb" onClick={()=>{setEditTestIdx(null);setTestForm({title:"",icon:"🎯",color:"#4F6EF7",subs:{},timeMin:30,desc:""});setView("builder");}} style={{background:"#4F6EF7",color:"#fff",borderColor:"#4F6EF7",padding:"10px 18px",fontSize:12,borderRadius:8}}>+ YANGI</button></div>
          {customTests.length===0?<div style={{...C,padding:"3rem",textAlign:"center"}}><div style={{fontSize:44,marginBottom:12}}>🧪</div><div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Hali test yo'q</div><button className="mb" onClick={()=>setView("builder")} style={{background:"#4F6EF7",color:"#fff",borderColor:"#4F6EF7",padding:"10px 20px",fontSize:12,borderRadius:8}}>TEST YARATISH →</button></div>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:14}}>{customTests.map((t,i)=>{const tq=t.counts.reduce((a,c)=>a+c,0);return<div key={t.id||i} style={{...C,padding:"1.3rem",borderColor:t.color+"30",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:-10,right:-10,fontSize:60,opacity:.05}}>{t.icon}</div><div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><div style={{width:42,height:42,borderRadius:10,background:t.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{t.icon}</div><div style={{display:"flex",gap:6}}><button className="mb" onClick={()=>editTest(i)} style={{background:"#4F6EF715",color:"#A0B4FF",borderColor:"#4F6EF730",padding:"6px 11px",fontSize:11,borderRadius:6}}>✏️</button><button className="mb" onClick={async()=>{try{await tApi.remove(t.id);setCustomTests(x=>x.filter((_,j)=>j!==i));notify("O'chirildi","warn");}catch(e){notify(e.message||"Xato","err");}}} style={{background:"var(--a12)",color:"var(--accent)",borderColor:"var(--a30)",padding:"6px 11px",fontSize:11,borderRadius:6}}>🗑️</button></div></div><div style={{fontWeight:800,fontSize:15,marginBottom:4}}>{t.title}</div>{t.desc&&<div style={{fontSize:12,color:th.sub,marginBottom:8}}>{t.desc}</div>}<div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}><span className="tag" style={{background:t.color+"18",color:t.color}}>⏱ {t.timeMin}daq</span><span className="tag" style={{background:th.soft,color:th.sub}}>{tq} savol</span></div><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{t.subjects.map((sid,j)=>{const s=sObj(sid);return<span key={sid} style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:s?.color+"15",color:s?.color}}>{s?.icon}{t.counts[j]}</span>;})}</div></div>;})}</div>}
        </div>}

        {/* USERS */}
        {view==="users"&&<div style={{animation:"fIn .3s"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h2 style={{fontSize:20,fontWeight:900,margin:0}}>👥 Foydalanuvchilar</h2><button className="mb" onClick={exportResults} style={{background:"var(--a15)",color:"var(--accent)",borderColor:"var(--a30)",padding:"10px 16px",fontSize:12,borderRadius:8}}>📤 EKSPORT</button></div>
          <div style={{position:"relative",marginBottom:14}}>
            <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:14,opacity:.6}}>🔍</span>
            <input value={uSearch} onChange={e=>setUSearch(e.target.value)} placeholder="Ism yoki telefon raqam bo'yicha qidirish..." style={{paddingLeft:"38px!important"}} />
            {uSearch&&<span onClick={()=>setUSearch("")} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",cursor:"pointer",color:th.faint,fontSize:16}}>×</span>}
          </div>
          {(()=>{const q=uSearch.trim().toLowerCase();const qd=q.replace(/\D/g,"");const filtered=users.filter(u=>{if(!q)return true;const nm=(u.name||"").toLowerCase();const dp=displayId(u.email).toLowerCase();const ml=(u.email||"").toLowerCase();const dg=(u.email||"").replace(/\D/g,"");return nm.includes(q)||dp.includes(q)||ml.includes(q)||(qd.length>=3&&dg.includes(qd));});return(
          <div style={{...C,overflow:"hidden"}}>
            <div style={{display:"grid",gridTemplateColumns:"1.6fr 1.4fr 1.2fr 0.8fr 0.6fr 1.4fr",padding:"11px 16px",borderBottom:`1px solid ${th.border}`,background:th.soft,fontSize:10,color:th.sub,letterSpacing:1,fontWeight:700}}><div>FOYDALANUVCHI {q&&`(${filtered.length})`}</div><div className="hideMob">TELEFON</div><div>ROL</div><div>TARIF</div><div>TEST</div><div>AMAL</div></div>
            {filtered.length===0?<div style={{padding:"2.5rem",textAlign:"center",color:th.faint}}>{q?"Topilmadi":"Foydalanuvchi yo'q"}</div>:filtered.map(u=>{const isProU=u.plan==="pro"&&(!u.pro_until||new Date(u.pro_until)>new Date());return<div key={u.id} style={{display:"grid",gridTemplateColumns:"1.6fr 1.4fr 1.2fr 0.8fr 0.6fr 1.4fr",padding:"12px 16px",borderBottom:`1px solid ${th.border}`,alignItems:"center",fontSize:13,opacity:u.blocked?.5:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:30,height:30,borderRadius:"50%",background:th.soft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>{u.avatar}</div><span style={{fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name}</span></div>
              <div className="hideMob" style={{color:th.sub,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayId(u.email)||"—"}</div>
              <div><select value={u.role} onChange={e=>changeRole(u.id,e.target.value)} style={{padding:"4px 6px!important",fontSize:11}}>{Object.entries(ROLES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></div>
              <div>{isProU?<span className="proBadge">PRO</span>:<span className="tag" style={{background:th.soft,color:th.sub,fontSize:10}}>Bepul</span>}</div>
              <div style={{fontWeight:700,color:"#00C896"}}>{uTestCount(u.id)}</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {isProU?<button className="mb" onClick={()=>revokePro(u.id)} style={{background:"#FF8C0012",color:"#FF8C00",borderColor:"#FF8C0030",padding:"5px 8px",fontSize:10,borderRadius:6}}>PRO−</button>:<button className="mb" onClick={()=>grantPro(u.id,30)} style={{background:"#FFD70018",color:"#FF8C00",borderColor:"#FFD70040",padding:"5px 8px",fontSize:10,borderRadius:6}}>PRO+30</button>}
                <button className="mb" onClick={()=>toggleBlock(u.id)} style={{background:u.blocked?"#00C89615":"var(--a12)",color:u.blocked?"#00C896":"var(--accent)",borderColor:u.blocked?"#00C89630":"var(--a30)",padding:"5px 8px",fontSize:10,borderRadius:6}}>{u.blocked?"OCHISH":"BLOK"}</button>
              </div>
            </div>;})}
          </div>
          );})()}
        </div>}

        {view==="manage"&&<div style={{animation:"fIn .3s"}}>
          <h2 style={{fontSize:20,fontWeight:900,margin:"0 0 16px"}}>🎁 Boshqaruv</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
            <div style={{...C,padding:"1.3rem"}}>
              <div style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700,marginBottom:12}}>🎟 PROMOKODLAR</div>
              <input value={pForm.code} onChange={e=>setPForm(f=>({...f,code:e.target.value}))} placeholder="Kod (masalan PRO2026)" style={{marginBottom:8,textTransform:"uppercase"}} />
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <div style={{flex:1}}><label style={{fontSize:10,color:th.sub}}>Necha kun PRO</label><input type="number" value={pForm.days} onChange={e=>setPForm(f=>({...f,days:e.target.value}))} /></div>
                <div style={{flex:1}}><label style={{fontSize:10,color:th.sub}}>Limit (0=cheksiz)</label><input type="number" value={pForm.max} onChange={e=>setPForm(f=>({...f,max:e.target.value}))} /></div>
              </div>
              <button className="mb" onClick={addPromo} style={{width:"100%",background:"var(--accent)",color:"#fff",borderColor:"var(--accent)",padding:"10px",fontSize:13,borderRadius:8,marginBottom:12}}>+ Yaratish</button>
              {promos.length===0?<div style={{fontSize:12,color:th.faint,textAlign:"center",padding:"10px"}}>Hali promokod yo'q</div>:promos.map(p=><div key={p.code} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderTop:`1px solid ${th.border}`,fontSize:13}}><b style={{flex:1}}>{p.code}</b><span style={{color:th.sub,fontSize:11}}>{p.days}kun · {p.used_count}/{p.max_uses||"∞"}</span><button onClick={()=>rmPromo(p.code)} style={{background:"none",border:"none",color:"#C0392B",cursor:"pointer",fontSize:15}}>🗑️</button></div>)}
            </div>
            <div style={{...C,padding:"1.3rem"}}>
              <div style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700,marginBottom:12}}>📢 E'LONLAR</div>
              <input value={aForm.title} onChange={e=>setAForm(f=>({...f,title:e.target.value}))} placeholder="Sarlavha" style={{marginBottom:8}} />
              <textarea value={aForm.body} onChange={e=>setAForm(f=>({...f,body:e.target.value}))} placeholder="Matn (ixtiyoriy)" style={{marginBottom:8}} />
              <button className="mb" onClick={addAnn} style={{width:"100%",background:"#16A34A",color:"#fff",borderColor:"#16A34A",padding:"10px",fontSize:13,borderRadius:8,marginBottom:12}}>+ E'lon joylash</button>
              {anns2.length===0?<div style={{fontSize:12,color:th.faint,textAlign:"center",padding:"10px"}}>Hali e'lon yo'q</div>:anns2.map(a=><div key={a.id} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"8px 0",borderTop:`1px solid ${th.border}`,fontSize:13}}><div style={{flex:1}}><b>{a.title}</b>{a.body&&<div style={{fontSize:12,color:th.sub}}>{a.body}</div>}</div><button onClick={()=>rmAnn(a.id)} style={{background:"none",border:"none",color:"#C0392B",cursor:"pointer",fontSize:15}}>🗑️</button></div>)}
            </div>
          </div>
        </div>}
      </div>
    </div>
  );
}

// ═══════════════ MAIN APP ═══════════════
function AppInner(){
  const [lang,setLang]=useState("uz");
  const [dark,setDark]=useState(true);
  const [muted,setMuted]=useState(false);
  const th=dark?THEMES.dark:THEMES.light;
  const t=k=>I18N[lang][k]||k;
  const playSound=useSound();
  const play=type=>playSound(type,muted);

  const [screen,setScreen]=useState("auth");
  const [authMode,setAuthMode]=useState("login");
  const [user,setUser]=useState(null);
  const [users,setUsers]=useState([]);
  const [form,setForm]=useState({name:"",email:"",password:"",confirm:"",role:"student"});
  const [errors,setErrors]=useState({});
  const [verifyCode,setVerifyCode]=useState("");
  const [sentCode,setSentCode]=useState("");
  const [codeInput,setCodeInput]=useState("");
  const [pendingUser,setPendingUser]=useState(null);
  const [resetEmail,setResetEmail]=useState("");
  const [newPw,setNewPw]=useState("");

  const [qBank,setQBank]=useState(buildInitialBank);
  const [customTests,setCustomTests]=useState([]);
  const [completedTests,setCompletedTests]=useState({});
  const [testHistory,setTestHistory]=useState([]);
  const [mixConfig,setMixConfig]=useState({subjects:[],count:20});
  const [bookmarks,setBookmarks]=useState([]);
  const [flash,setFlash]=useState(null);
  const [anns,setAnns]=useState([]);
  const [annDismiss,setAnnDismiss]=useState(false);
  const [promoInput,setPromoInput]=useState("");
  const [joinInput,setJoinInput]=useState("");
  const [grpTeach,setGrpTeach]=useState([]);
  const [grpMine,setGrpMine]=useState([]);
  const [grpMembers,setGrpMembers]=useState({});
  const [newGrpName,setNewGrpName]=useState("");

  const [activeTest,setActiveTest]=useState(null);
  const [tIdx,setTIdx]=useState(0);
  const [answers,setAnswers]=useState({});
  const [testDone,setTestDone]=useState(false);
  const [reviewMode,setReviewMode]=useState(false);
  const [timerOn,setTimerOn]=useState(false);
  const [timeUp,setTimeUp]=useState(false);
  const handleTimeUp=useCallback(()=>{setTimeUp(true);setTestDone(true);setTimerOn(false);},[]);
  const [timeLeft,resetTimer]=useCountdown(0,handleTimeUp,timerOn);

  const showFlash=(m,ty="ok")=>{setFlash({m,ty});setTimeout(()=>setFlash(null),3000);};
  const avgPct=testHistory.length?Math.round(testHistory.reduce((a,c)=>a+c.pct,0)/testHistory.length):0;
  const isPro = !!user && (user.role==="admin" || user.role==="teacher" || (user.plan==="pro" && (!user.pro_until || new Date(user.pro_until).getTime()>Date.now())));
  const proUntilStr = user?.pro_until ? new Date(user.pro_until).toLocaleDateString("uz-UZ") : null;
  const payCfg = (typeof window!=="undefined" && window.QUIZMANGA_CONFIG && window.QUIZMANGA_CONFIG.pay) || { price:"30 000", card:"8600 1234 5678 9012", name:"FanlarEdu", phone:"+998 90 123 45 67", telegram:"@quizmanga_admin" };
  const tgUser = (payCfg.telegram||"@quizmanga_admin").replace(/^@/,"").replace(/^https?:\/\/t\.me\//,"");
  const CSS=buildCSS(th);
  const C={background:th.card,border:`${th.cardBdW} solid ${th.cardBd}`,borderRadius:th.radius,boxShadow:th.cardShadow};

  // ── DATA LOADING (Supabase) ──
  const [loaded,setLoaded]=useState(false);
  const loadAllData=useCallback(async(profile)=>{
    try{
      const [qRows,tRows,rRows,bRows]=await Promise.all([
        qApi.list(), tApi.list(), rApi.listMine(), bApi.list(),
      ]);
      setQBank(groupBank(qRows));
      setCustomTests((tRows||[]).map(rowToTest));
      const hist=(rRows||[]).map(r=>({type:r.type,title:r.title,score:r.score,total:r.total,pct:r.pct,date:new Date(r.created_at).toLocaleDateString("uz-UZ"),user:profile?.name,subjectId:r.subject_id}));
      setTestHistory(hist);
      const cp={}; (rRows||[]).forEach(r=>{ if(r.subject_id){ if(!cp[r.subject_id]||r.pct>cp[r.subject_id].pct) cp[r.subject_id]={score:r.score,total:r.total,pct:r.pct}; } });
      setCompletedTests(cp);
      setBookmarks((bRows||[]).map(b=>b.questions?rowToQ(b.questions):null).filter(Boolean));
      try{ setAnns(await annApi.list()); }catch(e){}
      if(profile?.role==="admin"){ try{ setUsers(await pApi.listAll()); }catch(e){} }
    }catch(e){ console.error("Yuklash xatosi:",e); showFlash("Ma'lumot yuklashda xato","err"); }
  },[]);

  const refreshMe=async()=>{ try{ const prof=await pApi.me(user.id); setUser({...prof,email:user.email}); }catch(_){} };
  const redeemPromo=async()=>{
    if(!promoInput.trim())return;
    try{
      const r=await promoApi.redeem(promoInput.trim());
      if(r==="invalid")return showFlash("Promokod noto'g'ri","err");
      if(r==="used")return showFlash("Bu kod limiti tugagan","err");
      if(r==="auth")return showFlash("Avval kiring","err");
      if(typeof r==="string"&&r.startsWith("ok:")){ const days=r.split(":")[1]; await refreshMe(); setPromoInput(""); play("win"); showFlash(`PRO faollashtirildi! +${days} kun 🎉`); }
    }catch(e){ showFlash(e.message||"Xato","err"); }
  };
  const loadGroups=async()=>{
    try{ setGrpMine(await groupApi.myGroups()); }catch(e){}
    if(user?.role==="teacher"||user?.role==="admin"){ try{ setGrpTeach(await groupApi.myTeaching()); }catch(e){} }
  };
  const joinGroup=async()=>{
    if(!joinInput.trim())return;
    try{
      const r=await groupApi.join(joinInput.trim());
      if(r==="invalid")return showFlash("Guruh kodi topilmadi","err");
      if(r==="auth")return showFlash("Avval kiring","err");
      if(typeof r==="string"&&r.startsWith("ok:")){ setJoinInput(""); play("win"); showFlash(`"${r.slice(3)}" guruhiga qo'shildingiz ✓`); loadGroups(); }
    }catch(e){ showFlash(e.message||"Xato","err"); }
  };
  const createGroup=async()=>{
    if(!newGrpName.trim())return;
    const code=((newGrpName.toUpperCase().replace(/[^A-Z]/g,"").slice(0,3))||"GRP")+Math.floor(1000+Math.random()*9000);
    try{ await groupApi.create(newGrpName.trim(),code); setNewGrpName(""); play("win"); showFlash(`Guruh yaratildi! Kod: ${code}`); loadGroups(); }
    catch(e){ showFlash(e.message||"Xato","err"); }
  };
  const viewMembers=async(gid)=>{ try{ const m=await groupApi.members(gid); setGrpMembers(p=>({...p,[gid]:m})); }catch(e){ showFlash("Xato","err"); } };
  const delGroup=async(id)=>{ try{ await groupApi.remove(id); showFlash("O'chirildi"); loadGroups(); }catch(e){ showFlash(e.message||"Xato","err"); } };
  useEffect(()=>{ if(screen==="groups") loadGroups(); /* eslint-disable-next-line */ },[screen]);

  // ── SESSION / AUTH STATE ──
  useEffect(()=>{
    let active=true;
    (async()=>{
      const session=await auth.getSession();
      if(!active)return;
      if(session?.user){
        try{
          const prof=await pApi.me(session.user.id);
          if(prof.blocked){ await auth.signOut(); showFlash("Hisobingiz bloklangan!","err"); }
          else{ setUser({...prof,email:session.user.email}); await loadAllData(prof); setScreen("dashboard"); }
        }catch(e){ console.error(e); }
      }
      setLoaded(true);
    })();
    const unsub=auth.onChange(async(event,session)=>{
      if(event==="PASSWORD_RECOVERY"){ setScreen("newPassword"); }
      else if(event==="SIGNED_OUT"){ setUser(null); setScreen("auth"); setQBank(buildInitialBank()); setCustomTests([]); setTestHistory([]); setBookmarks([]); setCompletedTests({}); }
    });
    return()=>{ active=false; unsub(); };
  },[loadAllData]);

  // ── AUTH HANDLERS ──
  const doRegister=async()=>{
    const e={};
    if(!form.name.trim())e.name="Ism kiriting";
    if(!isValidPhone(form.email))e.email="Raqam xato (masalan +998 90 123 45 67)";
    if(form.password.length<6)e.password="Kamida 6 belgi";
    if(form.password!==form.confirm)e.confirm="Mos emas";
    if(Object.keys(e).length)return setErrors(e);
    setErrors({}); play("click");
    try{
      const avatar=AVATARS[Math.floor(Math.random()*AVATARS.length)];
      const email=phoneToEmail(form.email);
      await auth.signUp({email,password:form.password,name:form.name,role:form.role,avatar});
      // Email tasdiqlash o'chirilgani uchun darrov sessiya ochiladi
      const session=await auth.getSession();
      if(session?.user){
        let prof; for(let i=0;i<5&&!prof;i++){ try{prof=await pApi.me(session.user.id);}catch(_){ await new Promise(r=>setTimeout(r,400)); } }
        await claimDevice(session.user.id,(prof||{}).role||form.role);
        setUser({...(prof||{name:form.name,role:form.role,avatar}),id:session.user.id,email:session.user.email});
        await loadAllData(prof); setScreen("dashboard"); play("win"); showFlash(`${t("welcome")}, ${form.name}! 🎉`);
        setForm({name:"",email:"",password:"",confirm:"",role:"student"});
      } else { showFlash("Ro'yxatdan o'tildi! Endi kiring.","ok"); setAuthMode("login"); }
    }catch(err){ showFlash(/already|registered|exists/i.test(err.message||"")?"Bu raqam allaqachon ro'yxatda":(err.message||"Ro'yxatdan o'tishda xato"),"err"); }
  };
  const doLogin=async()=>{
    const e={};
    if(!form.email.trim() || (!isValidPhone(form.email) && !form.email.includes("@")))e.email="Raqam xato";
    if(!form.password)e.password="Parol kiriting";
    if(Object.keys(e).length)return setErrors(e);
    setErrors({});
    try{
      const { user:authUser }=await auth.signIn({email:loginToEmail(form.email),password:form.password});
      const prof=await pApi.me(authUser.id);
      if(prof.blocked){ await auth.signOut(); return showFlash("Hisobingiz bloklangan!","err"); }
      await claimDevice(authUser.id,prof.role);
      setUser({...prof,email:authUser.email}); await loadAllData(prof);
      setScreen("dashboard"); play("win"); showFlash(`${t("welcome")}, ${prof.name}! ⚡`);
      setForm({name:"",email:"",password:"",confirm:"",role:"student"});
    }catch(err){ showFlash(err.message==="Invalid login credentials"?"Raqam yoki parol xato!":(err.message||"Kirishda xato"),"err"); }
  };
  const doReset=async()=>{
    if(!resetEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))return showFlash("Email xato!","err");
    try{ await auth.resetPassword(resetEmail); setScreen("checkEmail"); }
    catch(err){ showFlash(err.message||"Xato","err"); }
  };
  const doSetNewPassword=async()=>{
    if(newPw.length<6)return showFlash("Parol kamida 6 belgi!","err");
    try{ await auth.updatePassword(newPw); showFlash("Parol yangilandi! ✓","ok"); setNewPw("");
      const session=await auth.getSession();
      if(session?.user){ const prof=await pApi.me(session.user.id); setUser({...prof,email:session.user.email}); await loadAllData(prof); setScreen("dashboard"); }
      else setScreen("auth");
    }catch(err){ showFlash(err.message||"Xato","err"); }
  };
  const doLogout=async()=>{ play("click"); await auth.signOut(); };

  // ── Qurilma cheklovi (bitta akkaunt = bitta qurilma; admin/o'qituvchi ozod) ──
  const claimDevice=async(uid,role)=>{ if(isStaffRole(role))return; try{ await pApi.setDevice(uid,getDeviceId()); }catch(_){} };
  const checkDevice=async(uid,role)=>{ if(isStaffRole(role))return; try{ const remote=await pApi.deviceOf(uid); if(remote && remote!==getDeviceId()){ showFlash("Bu akkauntga boshqa qurilmadan kirildi","err"); setTimeout(()=>auth.signOut(),1600); } }catch(_){} };
  useEffect(()=>{
    if(!user?.id || isStaffRole(user.role)) return;
    let alive=true; const run=()=>{ if(alive) checkDevice(user.id,user.role); };
    const t0=setTimeout(run,4000);
    const tid=setInterval(run,45000);
    const onVis=()=>{ if(document.visibilityState==="visible") run(); };
    document.addEventListener("visibilitychange",onVis);
    return ()=>{ alive=false; clearTimeout(t0); clearInterval(tid); document.removeEventListener("visibilitychange",onVis); };
    /* eslint-disable-next-line */
  },[user?.id,user?.role]);

  // ── TEST ──
  const launch=(type,title,questions,timeLimit,subjectId=null)=>{
    if(!questions.length)return showFlash("Bu testda savol yo'q!","err");
    setActiveTest({type,title,questions,timeLimit,subjectId});
    setTIdx(0);setAnswers({});setTestDone(false);setReviewMode(false);setTimeUp(false);setTimerOn(false);
    resetTimer(timeLimit||0);if(timeLimit)setTimeout(()=>setTimerOn(true),100);setScreen("test");
  };
  const attemptsOf=(sid)=>testHistory.filter(h=>h.subjectId===sid).length;
  const startSubject=(s)=>{
    const qc=(qBank[s.id]||[]).length;
    if(!qc)return showFlash("Bu fanda hali savol yo'q","err");
    const proOnly=PRO_SUBJECTS.has(s.id);
    if(proOnly&&!isPro)return setScreen("pro");
    const limit=proOnly?PRO_LIMIT:(isPro?20:1);
    if(attemptsOf(s.id)>=limit){
      if(!isPro&&!proOnly)return setScreen("pro");
      return showFlash(`Bu fan uchun urinishlar limiti (${limit}) tugadi`,"err");
    }
    launch("subject",s.name,buildQs([s.id],[Math.min(20,qc)],qBank),null,s.id);
  };
  const start50=()=>{
    if(!isPro)return setScreen("pro");
    const ids=SUBJECTS.map(s=>s.id);
    let qs=buildQs(ids,ids.map(()=>Math.ceil(50/ids.length)),qBank);
    qs=shuffleArr(qs).slice(0,50);
    if(qs.length<10)return showFlash("50 talik test uchun savol yetarli emas.","err");
    launch("gen50",`Aralash ${qs.length} savol`,qs,qs.length*60);
  };
  const launchCustom=(tt)=>{
    const qs=buildQs(tt.subjects,tt.counts,qBank);
    if(!qs.length)return showFlash("Bu testda savol yo'q — avval shu fanlarga savol qo'shing","err");
    const want=tt.counts.reduce((a,c)=>a+c,0);
    if(qs.length<want)showFlash(`Diqqat: ${want} savoldan faqat ${qs.length} tasi mavjud`,"err");
    launch("custom",tt.title,qs,tt.timeMin*60);
  };
  const selectAns=(idx,opt,multi)=>{
    play("click");
    if(multi){setAnswers(a=>{const cur=a[idx]||[];const nx=cur.includes(opt)?cur.filter(x=>x!==opt):[...cur,opt];return{...a,[idx]:nx};});}
    else setAnswers(a=>({...a,[idx]:opt}));
  };
  const submitTest=useCallback(()=>{
    if(!activeTest)return;
    const qs=activeTest.questions;
    const sc=qs.filter((q,i)=>isCorrect(q,answers[i])).length;
    const pc=Math.round((sc/qs.length)*100);
    setTestDone(true);setTimerOn(false);
    play(pc>=80?"win":pc>=50?"done":"wrong");
    if(activeTest.subjectId)setCompletedTests(c=>({...c,[activeTest.subjectId]:{score:sc,total:qs.length,pct:pc}}));
    setTestHistory(h=>[{type:activeTest.type,title:activeTest.title,score:sc,total:qs.length,pct:pc,date:new Date().toLocaleDateString("uz-UZ"),user:user?.name},...h.slice(0,29)]);
    if(user)rApi.add({user_id:user.id,title:activeTest.title,type:activeTest.type,subject_id:activeTest.subjectId,score:sc,total:qs.length,pct:pc}).catch(e=>console.error("Natija saqlanmadi:",e));
  },[activeTest,answers,user]);
  useEffect(()=>{if(timeUp&&!testDone)submitTest();},[timeUp]);
  const toggleBookmark=async q=>{
    play("click");
    const has=bookmarks.some(x=>x.id===q.id);
    setBookmarks(b=>has?b.filter(x=>x.id!==q.id):[...b,q]);
    try{ if(has)await bApi.remove(q.id); else await bApi.add(q.id); }catch(e){ console.error(e); }
  };

  // ── TopBar component ──
  const TopBar=({title,showBack,backTo})=>(
    <div style={{background:th.nav,borderBottom:`1px solid ${th.border}`,padding:"0 1.25rem",height:56,position:"sticky",top:0,zIndex:100}}>
      <div style={{maxWidth:1180,margin:"0 auto",display:"flex",alignItems:"center",height:"100%",gap:8}}>
        {showBack?<button className="mb" onClick={()=>setScreen(backTo||"dashboard")} style={{background:"transparent",color:th.text,borderColor:th.border,padding:"7px 12px",fontSize:11,borderRadius:6}}>← {t("back")}</button>:<span className="brand" style={{fontWeight:900,fontSize:18}}>Fanlar<span style={{color:"var(--accent)"}}>Edu</span></span>}
        {title&&<span style={{fontWeight:800,fontSize:15}}>{title}</span>}
        <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center"}}>
          <select value={lang} onChange={e=>setLang(e.target.value)} style={{width:"auto",padding:"5px 8px!important",fontSize:11}}>{["uz","ru","en"].map(l=><option key={l} value={l}>{l.toUpperCase()}</option>)}</select>
          <button onClick={()=>{setDark(d=>!d);play("click");}} title={t("theme")} style={{background:th.soft,border:`1px solid ${th.border}`,color:th.text,width:32,height:32,borderRadius:7,cursor:"pointer",fontSize:14}}>{dark?"☀️":"🌙"}</button>
          <button onClick={()=>setMuted(m=>!m)} title={t("sound")} style={{background:th.soft,border:`1px solid ${th.border}`,color:th.text,width:32,height:32,borderRadius:7,cursor:"pointer",fontSize:14}}>{muted?"🔇":"🔊"}</button>
        </div>
      </div>
    </div>
  );

  // ════════ AUTH SCREENS ════════
  // ════════ LOADING ════════
  if(!loaded)return(
    <div style={{minHeight:"100vh",background:th.bg,color:th.text,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-body)",gap:18}}>
      <style>{CSS}</style>
      <div className="brand" style={{fontWeight:900,fontSize:34,animation:"pop .5s"}}>Fanlar<span style={{color:"var(--accent)"}}>Edu</span></div>
      <div style={{display:"flex",gap:7}}>{[0,1,2].map(i=><div key={i} style={{width:11,height:11,borderRadius:"50%",background:"var(--accent)",animation:`pop .6s ${i*.15}s infinite alternate`}} />)}</div>
      <div style={{color:th.sub,fontSize:13}}>Ma'lumotlar yuklanmoqda...</div>
    </div>
  );

  if(screen==="auth")return(
    <div style={{minHeight:"100vh",background:th.bg,color:th.text,display:"flex",fontFamily:"var(--font-body)"}}>
      <style>{CSS}</style>
      {flash&&<div style={{position:"fixed",top:18,right:18,background:flash.ty==="err"?"#C0392B":"#00C896",padding:"10px 20px",borderRadius:8,fontWeight:700,fontSize:13,zIndex:1000,color:"#fff",animation:"sIn .3s"}}>{flash.m}</div>}
      <div style={{flex:"0 0 42%",background:"var(--accent)",display:"flex",flexDirection:"column",justifyContent:"center",padding:"3rem",position:"relative",overflow:"hidden"}} className="hideMob">
        <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(45deg,transparent,transparent 20px,rgba(255,255,255,.03) 20px,rgba(255,255,255,.03) 21px)"}} />
        <div className="brand" style={{fontSize:54,fontWeight:900,lineHeight:.9,color:"#fff",marginBottom:18}}>Fanlar<br/>Edu</div>
        <div style={{color:"rgba(255,255,255,.8)",fontSize:14,lineHeight:2}}>✦ 11 ta fan testlari<br/>✦ DTM simulyatori<br/>✦ Tahlil rejimi va analitika<br/>✦ 3 tilda · Light/Dark</div>
        <div style={{marginTop:36,display:"flex",gap:8,flexWrap:"wrap"}}>{["📐","⚡","🧪","🌍","💻","⚖️"].map((ic,i)=><div key={i} style={{width:36,height:36,borderRadius:8,background:"rgba(255,255,255,.16)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>{ic}</div>)}</div>
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem"}}>
        <div style={{width:"100%",maxWidth:380,animation:"fIn .4s"}}>
          <div style={{display:"flex",justifyContent:"flex-end",gap:6,marginBottom:20}}>
            <select value={lang} onChange={e=>setLang(e.target.value)} style={{width:"auto",padding:"5px 8px!important",fontSize:11}}>{["uz","ru","en"].map(l=><option key={l} value={l}>{l.toUpperCase()}</option>)}</select>
            <button onClick={()=>setDark(d=>!d)} style={{background:th.soft,border:`1px solid ${th.border}`,color:th.text,width:30,height:30,borderRadius:7,cursor:"pointer"}}>{dark?"☀️":"🌙"}</button>
          </div>
          <div style={{display:"flex",marginBottom:28,border:`1.5px solid ${th.border}`,borderRadius:8,overflow:"hidden"}}>
            {[["login",t("login")],["register",t("register")]].map(([m,l])=><button key={m} onClick={()=>{setAuthMode(m);setErrors({});}} style={{flex:1,padding:11,border:"none",background:authMode===m?"var(--accent)":"transparent",color:authMode===m?"#fff":th.sub,fontWeight:800,fontSize:12,cursor:"pointer"}}>{l}</button>)}
          </div>
          {authMode==="register"&&<div style={{marginBottom:14}}><label style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700,display:"block",marginBottom:5}}>{t("name").toUpperCase()}</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Ali Valiyev" style={{animation:errors.name?"shake .3s":"none"}} />{errors.name&&<div style={{color:"var(--accent)",fontSize:12,marginTop:4}}>{errors.name}</div>}</div>}
          <div style={{marginBottom:14}}><label style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700,display:"block",marginBottom:5}}>TELEFON RAQAM</label><input type="tel" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="+998 90 123 45 67" />{errors.email&&<div style={{color:"var(--accent)",fontSize:12,marginTop:4}}>{errors.email}</div>}</div>
          <div style={{marginBottom:14}}><label style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700,display:"block",marginBottom:5}}>{t("password").toUpperCase()}</label><input type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="••••••••" />{errors.password&&<div style={{color:"var(--accent)",fontSize:12,marginTop:4}}>{errors.password}</div>}</div>
          {authMode==="register"&&<>
            <div style={{marginBottom:14}}><label style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700,display:"block",marginBottom:5}}>{t("confirm").toUpperCase()}</label><input type="password" value={form.confirm} onChange={e=>setForm(f=>({...f,confirm:e.target.value}))} placeholder="••••••••" />{errors.confirm&&<div style={{color:"var(--accent)",fontSize:12,marginTop:4}}>{errors.confirm}</div>}</div>
            <div style={{marginBottom:18}}><label style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700,display:"block",marginBottom:7}}>{t("role").toUpperCase()}</label><div style={{display:"flex",gap:8}}>{Object.entries(ROLES).filter(([k])=>k!=="admin").map(([k,v])=><div key={k} onClick={()=>setForm(f=>({...f,role:k}))} style={{flex:1,padding:"10px",borderRadius:8,border:`1.5px solid ${form.role===k?"var(--accent)":th.border}`,background:form.role===k?"var(--a12)":"transparent",textAlign:"center",cursor:"pointer",fontSize:12,fontWeight:700,color:form.role===k?"var(--accent)":th.sub}}>{v.icon} {v.label}</div>)}</div></div>
          </>}
          <button className="mb" onClick={authMode==="register"?doRegister:doLogin} style={{width:"100%",background:"var(--accent)",color:"#fff",borderColor:"var(--accent)",padding:"13px",fontSize:14,borderRadius:8}}>{authMode==="register"?t("register")+" →":t("login")+" →"}</button>
          {authMode==="login"&&<div style={{textAlign:"center",marginTop:14,color:th.faint,fontSize:12}}>Parolni unutsangiz — administratorga murojaat qiling</div>}
          <div style={{textAlign:"center",marginTop:14,color:th.faint,fontSize:12,lineHeight:1.6}}>Telefon raqam va parol bilan darrov ro'yxatdan o'tasiz</div>
        </div>
      </div>
    </div>
  );

  // VERIFY EMAIL
  // CHECK EMAIL (ro'yxat yoki parol tiklashdan keyin)
  if(screen==="checkEmail")return(
    <div style={{minHeight:"100vh",background:th.bg,color:th.text,display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem",fontFamily:"var(--font-body)"}}>
      <style>{CSS}</style>
      <div style={{maxWidth:420,width:"100%",textAlign:"center",animation:"pop .35s"}}>
        <div style={{fontSize:56,marginBottom:14}}>📧</div>
        <h2 style={{fontSize:24,fontWeight:900,margin:"0 0 10px"}}>Emailingizni tekshiring</h2>
        <p style={{color:th.sub,fontSize:14,lineHeight:1.7,marginBottom:22}}>Sizga tasdiqlash havolasi yuborildi. Email'dagi havolani bosib, hisobingizni faollashtiring yoki parolni tiklang. (Spam papkasini ham tekshiring.)</p>
        <button className="mb" onClick={()=>{setScreen("auth");setAuthMode("login");}} style={{width:"100%",background:"var(--accent)",color:"#fff",borderColor:"var(--accent)",padding:"13px",fontSize:14,borderRadius:8}}>{t("login")} ekraniga qaytish →</button>
      </div>
    </div>
  );

  // NEW PASSWORD (email havolasidan keyin — parol tiklash)
  if(screen==="newPassword")return(
    <div style={{minHeight:"100vh",background:th.bg,color:th.text,display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem",fontFamily:"var(--font-body)"}}>
      <style>{CSS}</style>
      {flash&&<div style={{position:"fixed",top:18,right:18,background:flash.ty==="err"?"#C0392B":"#00C896",padding:"10px 20px",borderRadius:8,fontWeight:700,fontSize:13,zIndex:1000,color:"#fff",animation:"sIn .3s"}}>{flash.m}</div>}
      <div style={{maxWidth:400,width:"100%",textAlign:"center",animation:"pop .35s"}}>
        <div style={{fontSize:56,marginBottom:14}}>🔑</div>
        <h2 style={{fontSize:24,fontWeight:900,margin:"0 0 8px"}}>{t("newPw")}</h2>
        <p style={{color:th.sub,fontSize:14,marginBottom:20}}>Yangi parolingizni kiriting (kamida 6 belgi)</p>
        <input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder={t("newPw")} style={{marginBottom:16}} />
        <button className="mb" onClick={doSetNewPassword} style={{width:"100%",background:"var(--accent)",color:"#fff",borderColor:"var(--accent)",padding:"13px",fontSize:14,borderRadius:8}}>{t("save")} ✓</button>
      </div>
    </div>
  );

  // FORGOT PASSWORD
  if(screen==="forgot")return(
    <div style={{minHeight:"100vh",background:th.bg,color:th.text,display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem",fontFamily:"var(--font-body)"}}>
      <style>{CSS}</style>
      {flash&&<div style={{position:"fixed",top:18,right:18,background:flash.ty==="err"?"#C0392B":"#00C896",padding:"10px 20px",borderRadius:8,fontWeight:700,fontSize:13,zIndex:1000,color:"#fff",animation:"sIn .3s"}}>{flash.m}</div>}
      <div style={{maxWidth:400,width:"100%",textAlign:"center",animation:"pop .35s"}}>
        <div style={{fontSize:56,marginBottom:14}}>🔑</div>
        <h2 style={{fontSize:24,fontWeight:900,margin:"0 0 8px"}}>{t("resetPw")}</h2>
        <p style={{color:th.sub,fontSize:14,marginBottom:20}}>Emailingizni kiriting, tasdiqlash kodi yuboramiz</p>
        <input type="email" value={resetEmail} onChange={e=>setResetEmail(e.target.value)} placeholder="email@example.com" style={{marginBottom:16}} />
        <button className="mb" onClick={doReset} style={{width:"100%",background:"var(--accent)",color:"#fff",borderColor:"var(--accent)",padding:"13px",fontSize:14,borderRadius:8}}>KOD YUBORISH →</button>
        <div style={{marginTop:14}}><span onClick={()=>setScreen("auth")} style={{color:th.sub,cursor:"pointer",fontSize:13}}>← {t("back")}</span></div>
      </div>
    </div>
  );

  // ════════ ADMIN ════════
  if(screen==="admin")return<AdminPanel qBank={qBank} setQBank={setQBank} customTests={customTests} setCustomTests={setCustomTests} users={users} setUsers={setUsers} testHistory={testHistory} onBack={()=>setScreen("dashboard")} th={th} t={t} />;

  // ════════ PROFILE ════════
  if(screen==="profile")return(
    <div style={{minHeight:"100vh",background:th.bg,color:th.text,fontFamily:"var(--font-body)"}}>
      <style>{CSS}</style>
      <TopBar showBack title={"👤 "+t("profile")} />
      <div style={{maxWidth:620,margin:"0 auto",padding:"2rem 1.5rem",animation:"fIn .4s"}}>
        <div style={{...C,padding:"2rem",textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:64,marginBottom:10}}>{user?.avatar}</div>
          <div style={{fontWeight:900,fontSize:22}}>{user?.name}</div>
          <div style={{color:th.sub,fontSize:13,marginBottom:8}}>{displayId(user?.email)}</div>
          <span className="tag" style={{background:"var(--a15)",color:"var(--accent)"}}>{ROLES[user?.role]?.icon} {ROLES[user?.role]?.label}</span>
          {isPro?<span className="proBadge" style={{marginLeft:6}}>PRO{proUntilStr?` · ${proUntilStr}`:""}</span>:<span onClick={()=>setScreen("pro")} className="tag" style={{background:th.soft,color:th.sub,marginLeft:6,cursor:"pointer"}}>BEPUL · PRO ol →</span>}
          <div style={{marginTop:18}}>
            <div style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700,marginBottom:10}}>AVATAR TANLANG</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:7,justifyContent:"center"}}>{AVATARS.map(a=><div key={a} onClick={()=>{setUser(u=>({...u,avatar:a}));pApi.update(user.id,{avatar:a}).catch(e=>console.error(e));play("click");}} style={{width:40,height:40,borderRadius:10,background:user?.avatar===a?"var(--a20)":th.soft,border:`1.5px solid ${user?.avatar===a?"var(--accent)":th.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,cursor:"pointer"}}>{a}</div>)}</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
          {[["Testlar",testHistory.filter(h=>h.user===user?.name).length,"#1A85FF"],["O'rtacha",avgPct+"%","#00C896"],["Fanlar",Object.keys(completedTests).length+"/"+SUBJECTS.length,"#FF8C00"]].map(([l,v,c])=><div key={l} style={{...C,padding:"1.1rem",textAlign:"center"}}><div style={{fontSize:24,fontWeight:900,color:c}}>{v}</div><div style={{fontSize:11,color:th.sub,marginTop:3}}>{l}</div></div>)}
        </div>
        {bookmarks.length>0&&<div style={{...C,padding:"1.4rem",marginBottom:16}}><div style={{fontSize:10,color:th.sub,letterSpacing:3,fontWeight:700,marginBottom:12}}>🔖 {t("bookmarked")} ({bookmarks.length})</div>{bookmarks.slice(0,5).map((q,i)=><div key={i} style={{display:"flex",gap:8,padding:"8px 0",borderBottom:i<Math.min(bookmarks.length,5)-1?`1px solid ${th.border}`:"none",fontSize:13}}><span>{sObj(q.subjectId)?.icon||"📌"}</span><span style={{flex:1,color:th.sub}}>{q.q}</span></div>)}</div>}
        <button className="mb" onClick={doLogout} style={{width:"100%",background:"transparent",color:"var(--accent)",borderColor:"var(--a40)",padding:"12px",fontSize:13,borderRadius:8}}>{t("logout")} →</button>
      </div>
    </div>
  );

  // ════════ DASHBOARD ════════
  if(screen==="dashboard")return(
    <div style={{minHeight:"100vh",background:th.bg,color:th.text,paddingBottom:"3rem",fontFamily:"var(--font-body)"}}>
      <style>{CSS}</style>
      {flash&&<div style={{position:"fixed",top:18,right:18,background:flash.ty==="err"?"#C0392B":"#00C896",padding:"10px 20px",borderRadius:8,fontWeight:700,fontSize:13,zIndex:1000,color:"#fff",animation:"sIn .3s"}}>{flash.m}</div>}
      <div style={{background:th.nav,borderBottom:`1px solid ${th.border}`,padding:"6px 1.25rem",minHeight:56,position:"sticky",top:0,zIndex:100}} className="padMob">
        <div className="appHeader" style={{maxWidth:1180,margin:"0 auto",minHeight:44}}>
          <span className="brand" style={{fontWeight:900,fontSize:18}}>Fanlar<span style={{color:"var(--accent)"}}>Edu</span></span>
          <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
            <button className="mb" onClick={()=>setScreen("groups")} title="Guruhlar" style={{background:th.soft,color:th.text,borderColor:th.border,padding:"7px 12px",fontSize:13,borderRadius:8}}>👥</button>
            <button className="mb hideMob" onClick={()=>setScreen("proHub")} style={{background:"var(--a12)",color:"var(--accent)",borderColor:"transparent",padding:"7px 14px",fontSize:11,borderRadius:8}}>⭐ {t("proHub")}</button>
            <button className="mb hideMob" onClick={()=>setScreen("analytics")} style={{background:"transparent",color:"#9C27B0",borderColor:"#9C27B025",padding:"7px 12px",fontSize:11,borderRadius:6}}>📊</button>
            {user?.role==="admin"&&<button className="mb" onClick={()=>setScreen("admin")} style={{background:"#4F6EF715",color:"#4F6EF7",borderColor:"#4F6EF730",padding:"7px 12px",fontSize:11,borderRadius:6}}>⚙️ {t("admin")}</button>}
            <select value={lang} onChange={e=>setLang(e.target.value)} style={{width:"auto",padding:"5px 7px!important",fontSize:11}}>{["uz","ru","en"].map(l=><option key={l} value={l}>{l.toUpperCase()}</option>)}</select>
            <button onClick={()=>setDark(d=>!d)} style={{background:th.soft,border:`1px solid ${th.border}`,color:th.text,width:30,height:30,borderRadius:7,cursor:"pointer"}}>{dark?"☀️":"🌙"}</button>
            <button onClick={()=>setMuted(m=>!m)} style={{background:th.soft,border:`1px solid ${th.border}`,color:th.text,width:30,height:30,borderRadius:7,cursor:"pointer"}}>{muted?"🔇":"🔊"}</button>
            <div onClick={()=>setScreen("profile")} style={{width:34,height:34,borderRadius:"50%",background:th.soft,border:`1.5px solid ${th.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,cursor:"pointer"}}>{user?.avatar}</div>
          </div>
        </div>
      </div>
      <div style={{maxWidth:1180,margin:"0 auto",padding:"0 1.25rem"}}>
        <div style={{padding:"1.5rem 0 1.25rem"}}>
          <h2 style={{fontSize:24,fontWeight:900,margin:"0 0 1.2rem"}}>{t("welcome")}, {user?.name} 👋</h2>
          {anns.length>0&&!annDismiss&&<div style={{background:"var(--a08)",border:"1px solid var(--a20)",borderRadius:12,padding:"14px 16px",marginBottom:"1.2rem",display:"flex",gap:12,alignItems:"flex-start"}}><div style={{fontSize:20}}>📢</div><div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{anns[0].title}</div>{anns[0].body&&<div style={{fontSize:13,color:th.sub,marginTop:2,lineHeight:1.5}}>{anns[0].body}</div>}</div><button onClick={()=>setAnnDismiss(true)} style={{background:"none",border:"none",color:th.faint,fontSize:18,cursor:"pointer",lineHeight:1}}>×</button></div>}
          {!isPro&&<div onClick={()=>setScreen("pro")} style={{cursor:"pointer",background:"linear-gradient(100deg,var(--accent),#6B83FF)",borderRadius:14,padding:"16px 20px",marginBottom:"1.2rem",display:"flex",alignItems:"center",gap:14,color:"#fff",boxShadow:th.cardShadow}}><div style={{fontSize:24}}>⭐</div><div style={{flex:1}}><div style={{fontWeight:700,fontSize:15}}>PRO bilan to'liq imtihonga tayyorlaning</div><div style={{fontSize:13,opacity:.85}}>DTM simulyatori, Marathon va Tezkor testlar</div></div><span style={{background:"#fff",color:"var(--accent)",fontWeight:700,fontSize:13,padding:"8px 16px",borderRadius:9}}>Ko'rish</span></div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:11}} className="gridMob">
            {[[t("subjects"),Object.keys(completedTests).length+"/"+SUBJECTS.length,"#16A34A","✅"],["O'rtacha",avgPct?avgPct+"%":"—","#2F54EB","📊"],["Custom",customTests.length,"#8B5CF6","🧪"],["Belgilangan",bookmarks.length,"#F59E0B","🔖"]].map(([l,v,c,ic],i)=><div key={i} style={{...C,padding:"16px"}}><div style={{width:34,height:34,borderRadius:9,background:c+"1f",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,marginBottom:10}}>{ic}</div><div style={{fontSize:23,fontWeight:800,color:th.text}}>{v}</div><div style={{fontSize:12,color:th.sub,marginTop:1}}>{l}</div></div>)}
          </div>
        </div>
        {/* mobile pro buttons */}
        <div style={{display:"flex",gap:8,marginBottom:18}}>
          <button className="mb" onClick={()=>setScreen("proHub")} style={{flex:1,background:"var(--a12)",color:"var(--accent)",borderColor:"transparent",padding:"11px",fontSize:12,borderRadius:10}}>⭐ {t("proHub")}</button>
          <button className="mb" onClick={()=>setScreen("analytics")} style={{flex:1,background:th.card,color:th.text,borderColor:th.border,padding:"11px",fontSize:12,borderRadius:10}}>📊 {t("analytics")}</button>
        </div>
        {customTests.length>0&&<div style={{marginBottom:20}}><div style={{fontSize:10,color:"#4F6EF7",letterSpacing:4,fontWeight:700,marginBottom:12}}>ADMIN TESTLARI</div><div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:4}}>{customTests.map((tt,i)=>{const tq=tt.counts.reduce((a,c)=>a+c,0);return<div key={tt.id||i} className="card ch" onClick={()=>launchCustom(tt)} style={{padding:"1.1rem",cursor:"pointer",flexShrink:0,width:190,borderColor:tt.color+"30",background:`linear-gradient(135deg,${tt.color}15,transparent)`}}><div style={{fontSize:24,marginBottom:5}}>{tt.icon}</div><div style={{fontWeight:800,fontSize:13,color:tt.color,marginBottom:3}}>{tt.title}</div><div style={{fontSize:11,color:th.sub}}>{tq} savol · {tt.timeMin}daq</div></div>;})}</div></div>}
        <div style={{fontSize:10,color:th.sub,letterSpacing:4,fontWeight:700,marginBottom:14}}>{t("subjects").toUpperCase()}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:12}}>
          {SUBJECTS.map(s=>{const d=completedTests[s.id];const qc=(qBank[s.id]||[]).length;const proOnly=PRO_SUBJECTS.has(s.id);const lim=proOnly?PRO_LIMIT:(isPro?20:1);const locked=(proOnly&&!isPro)||attemptsOf(s.id)>=lim;return<div key={s.id} className="card ch" onClick={()=>startSubject(s)} style={{padding:"16px",cursor:"pointer",position:"relative"}}>
            {proOnly&&<span style={{position:"absolute",top:10,right:10,fontSize:9,fontWeight:800,letterSpacing:1,background:"var(--accent2)",color:"#000",padding:"2px 7px",borderRadius:6}}>PRO</span>}
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:13}}>
              <div style={{width:44,height:44,borderRadius:12,background:s.color+"1f",display:"flex",alignItems:"center",justifyContent:"center",fontSize:21,flexShrink:0}}>{s.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:15}}>{s.name}</div>
                <div style={{fontSize:12,color:th.sub,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d?`${d.score}/${d.total} ${t("correct")}`:`${qc} ta savol`}</div>
              </div>
              <div style={{fontSize:13,fontWeight:700,color:d?gColor(d.pct):"var(--accent)",flexShrink:0}}>{locked?"🔒":d?d.pct+"%":t("start")}</div>
            </div>
            <div style={{height:6,background:th.soft,borderRadius:6,overflow:"hidden"}}><div style={{height:"100%",width:d?`${d.pct}%`:"0%",background:d?gColor(d.pct):"var(--accent)",borderRadius:6,transition:"width .6s"}} /></div>
          </div>;})}
        </div>
      </div>
    </div>
  );

  // ════════ PRO HUB ════════
  // ════════ PRO UPGRADE ════════
  if(screen==="groups")return(
    <div style={{minHeight:"100vh",background:th.bg,color:th.text,paddingBottom:"3rem",fontFamily:"var(--font-body)"}}>
      <style>{CSS}</style>
      {flash&&<div style={{position:"fixed",top:18,right:18,background:flash.ty==="err"?"#C0392B":"#16A34A",padding:"10px 20px",borderRadius:8,fontWeight:700,fontSize:13,zIndex:1000,color:"#fff",animation:"sIn .3s"}}>{flash.m}</div>}
      <TopBar showBack title="👥 Guruhlar" />
      <div style={{maxWidth:760,margin:"0 auto",padding:"1.5rem 1.25rem",animation:"fIn .4s"}} className="padMob">
        <div style={{...C,padding:"1.3rem",marginBottom:18}}>
          <div style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700,marginBottom:10}}>GURUHGA QO'SHILISH</div>
          <p style={{fontSize:13,color:th.sub,marginBottom:10}}>O'qituvchingiz bergan guruh kodini kiriting.</p>
          <div style={{display:"flex",gap:8}}>
            <input value={joinInput} onChange={e=>setJoinInput(e.target.value)} placeholder="Guruh kodi (masalan MAT1234)" style={{flex:1,textTransform:"uppercase"}} />
            <button className="mb" onClick={joinGroup} style={{background:"var(--accent)",color:"#fff",borderColor:"var(--accent)",padding:"0 18px",fontSize:13,borderRadius:10}}>Qo'shilish</button>
          </div>
          {grpMine.length>0&&<div style={{marginTop:12,display:"flex",flexWrap:"wrap",gap:6}}>{grpMine.map((m,i)=><span key={i} className="tag" style={{background:"var(--a08)",color:"var(--accent)"}}>{m.groups?.name||"Guruh"}</span>)}</div>}
        </div>
        {(user?.role==="teacher"||user?.role==="admin")&&<>
          <div style={{...C,padding:"1.3rem",marginBottom:18}}>
            <div style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700,marginBottom:10}}>YANGI GURUH (o'qituvchi)</div>
            <div style={{display:"flex",gap:8}}>
              <input value={newGrpName} onChange={e=>setNewGrpName(e.target.value)} placeholder="Guruh nomi (masalan 11-A sinf)" style={{flex:1}} />
              <button className="mb" onClick={createGroup} style={{background:"#16A34A",color:"#fff",borderColor:"#16A34A",padding:"0 18px",fontSize:13,borderRadius:10}}>Yaratish</button>
            </div>
          </div>
          <div style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700,marginBottom:10}}>MENING GURUHLARIM</div>
          {grpTeach.length===0?<div style={{...C,padding:"1.5rem",textAlign:"center",color:th.faint,fontSize:13}}>Hali guruh yaratmadingiz</div>:grpTeach.map(g=><div key={g.id} style={{...C,padding:"1.1rem",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:140}}><div style={{fontWeight:700,fontSize:15}}>{g.name}</div><div style={{fontSize:12,color:th.sub}}>Kod: <b style={{color:"var(--accent)"}}>{g.code}</b></div></div>
              <button className="mb" onClick={()=>viewMembers(g.id)} style={{background:th.soft,color:th.text,borderColor:th.border,padding:"6px 12px",fontSize:11,borderRadius:8}}>A'zolar</button>
              <button className="mb" onClick={()=>delGroup(g.id)} style={{background:"#C0392B12",color:"#C0392B",borderColor:"#C0392B30",padding:"6px 12px",fontSize:11,borderRadius:8}}>O'chirish</button>
            </div>
            {grpMembers[g.id]&&<div style={{marginTop:12,borderTop:`1px solid ${th.border}`,paddingTop:10}}>
              {grpMembers[g.id].length===0?<div style={{fontSize:12,color:th.faint}}>Hali a'zo yo'q</div>:grpMembers[g.id].map(m=><div key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",fontSize:13}}><span style={{fontSize:17}}>{m.avatar}</span><span style={{flex:1,fontWeight:600}}>{m.name}</span><span style={{color:th.sub,fontSize:12}}>{m.tests} test</span><span style={{fontWeight:700,color:m.avg>=70?"#16A34A":"#EA9A1F",width:42,textAlign:"right"}}>{m.avg}%</span></div>)}
            </div>}
          </div>)}
        </>}
      </div>
    </div>
  );

  if(screen==="pro")return(
    <div style={{minHeight:"100vh",background:th.bg,color:th.text,paddingBottom:"3rem",fontFamily:"var(--font-body)"}}>
      <style>{CSS}</style>
      {flash&&<div style={{position:"fixed",top:18,right:18,background:flash.ty==="err"?"#C0392B":"#00C896",padding:"10px 20px",borderRadius:8,fontWeight:700,fontSize:13,zIndex:1000,color:"#fff",animation:"sIn .3s"}}>{flash.m}</div>}
      <TopBar showBack title={<><span className="proBadge">PRO</span> Tarif</>} />
      <div style={{maxWidth:760,margin:"0 auto",padding:"2rem 1.25rem",animation:"fIn .4s"}}>
        {isPro?(
          <div style={{...C,padding:"2rem",textAlign:"center",borderColor:"#FFD70040",background:`var(--soft)`}}>
            <div style={{fontSize:54,marginBottom:12}}>👑</div>
            <h2 style={{fontSize:24,fontWeight:900,margin:"0 0 8px"}}>Siz PRO foydalanuvchisiz!</h2>
            <p style={{color:th.sub,fontSize:14}}>{proUntilStr?`Obuna ${proUntilStr} gacha amal qiladi`:"Cheksiz kirish ochiq"}</p>
          </div>
        ):(<>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:48,marginBottom:8}}>⭐</div>
            <h2 style={{fontSize:26,fontWeight:900,margin:"0 0 6px"}}>PRO tarifga o'ting</h2>
            <p style={{color:th.sub,fontSize:14}}>Barcha imkoniyatlar va imtihonlarga to'liq kirish</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:18}} className="gridMob">
            <div style={{...C,padding:"1.5rem"}}>
              <div style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700,marginBottom:6}}>BEPUL</div>
              <div style={{fontSize:24,fontWeight:900,marginBottom:14}}>0 so'm</div>
              {[["✓","11 fan testlari"],["✓","Aralash test"],["✓","Tahlil rejimi"],["✗","DTM simulyatori"],["✗","Marathon & Tezkor"]].map(([c,l],i)=><div key={i} style={{display:"flex",gap:8,fontSize:13,marginBottom:8,color:c==="✓"?th.text:th.faint}}><span style={{color:c==="✓"?"#00C896":th.faint}}>{c}</span>{l}</div>)}
            </div>
            <div style={{...C,padding:"1.5rem",borderColor:"#FFD70050",background:`var(--soft)`,position:"relative"}}>
              <div style={{position:"absolute",top:12,right:12}}><span className="proBadge">TAVSIYA</span></div>
              <div style={{fontSize:10,color:"#FF8C00",letterSpacing:2,fontWeight:700,marginBottom:6}}>PRO</div>
              <div style={{fontSize:24,fontWeight:900,marginBottom:2}}>{payCfg.price} so'm</div>
              <div style={{fontSize:11,color:th.sub,marginBottom:14}}>oyiga</div>
              {[["✓","Hamma bepul imkoniyatlar"],["✓","DTM simulyatori (70 savol)"],["✓","Marathon (55 savol)"],["✓","Tezkor test"],["✓","Cheksiz mashq"]].map(([c,l],i)=><div key={i} style={{display:"flex",gap:8,fontSize:13,marginBottom:8}}><span style={{color:"#00C896"}}>{c}</span>{l}</div>)}
            </div>
          </div>
          <div style={{...C,padding:"1.5rem"}}>
            <div style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700,marginBottom:12}}>💳 TO'LOV QILISH</div>
            <p style={{fontSize:13,color:th.sub,lineHeight:1.7,marginBottom:14}}>Quyidagi kartaga <b style={{color:th.text}}>{payCfg.price} so'm</b> o'tkazing, so'ng to'lov chekini (skrinshot) Telegram orqali <b style={{color:"var(--accent)"}}>{payCfg.telegram}</b> ga yuboring. Tekshirilgach PRO faollashtiriladi.</p>
            <div style={{background:th.soft,borderRadius:10,padding:"1.2rem",textAlign:"center",marginBottom:14}}>
              <div style={{fontSize:22,fontWeight:900,letterSpacing:2,fontVariantNumeric:"tabular-nums"}}>{payCfg.card}</div>
              <div style={{fontSize:13,color:th.sub,marginTop:6}}>{payCfg.name}</div>
              <div style={{fontSize:13,color:th.sub}}>{payCfg.phone}</div>
            </div>
            <a href={`https://t.me/${tgUser}`} target="_blank" rel="noreferrer" onClick={()=>{play("click");showFlash("Telegram ochildi — skrinshotni yuboring","ok");}} style={{textDecoration:"none"}}><button className="mb" style={{width:"100%",background:"#229ED9",color:"#fff",borderColor:"transparent",padding:"13px",fontSize:14,borderRadius:10}}>✈️ TO'LOV QILDIM — SKRINSHOTNI TELEGRAMGA YUBORISH</button></a>
            <p style={{fontSize:11,color:th.faint,textAlign:"center",marginTop:12,lineHeight:1.6}}>Avtomatik to'lov (Payme/Click) keyinchalik ulanadi — README dagi qo'llanmaga qarang</p>
          </div>
          <div style={{...C,padding:"1.3rem",marginTop:14}}>
            <div style={{fontSize:10,color:th.sub,letterSpacing:2,fontWeight:700,marginBottom:10}}>🎁 PROMOKOD</div>
            <p style={{fontSize:12,color:th.sub,marginBottom:10}}>Promokodingiz bo'lsa, shu yerga kiriting — PRO darrov faollashadi.</p>
            <div style={{display:"flex",gap:8}}>
              <input value={promoInput} onChange={e=>setPromoInput(e.target.value)} placeholder="Masalan: PRO2026" style={{flex:1,textTransform:"uppercase"}} />
              <button className="mb" onClick={redeemPromo} style={{background:"var(--accent)",color:"#fff",borderColor:"var(--accent)",padding:"0 18px",fontSize:13,borderRadius:10}}>Faollashtirish</button>
            </div>
          </div>
        </>)}
      </div>
    </div>
  );

  if(screen==="proHub")return(
    <div style={{minHeight:"100vh",background:th.bg,color:th.text,paddingBottom:"3rem",fontFamily:"var(--font-body)"}}>
      <style>{CSS}</style>
      {flash&&<div style={{position:"fixed",top:18,right:18,background:flash.ty==="err"?"#C0392B":"#00C896",padding:"10px 20px",borderRadius:8,fontWeight:700,fontSize:13,zIndex:1000,color:"#fff",animation:"sIn .3s"}}>{flash.m}</div>}
      <TopBar showBack title={<><span className="proBadge">PRO</span> {t("proHub")}</>} />
      <div style={{maxWidth:1060,margin:"0 auto",padding:"2rem 1.25rem",animation:"fIn .4s"}}>
        <div style={{background:`var(--soft)`,border:"1.5px solid var(--a30)",borderRadius:12,padding:"1.6rem",marginBottom:16,position:"relative"}}>
          <div style={{position:"absolute",top:14,right:14}}><span style={{background:"var(--accent)",color:"#fff",fontSize:10,fontWeight:800,padding:"3px 12px",borderRadius:20}}>MASHHUR</span></div>
          <div style={{fontSize:10,color:"var(--accent)",letterSpacing:3,fontWeight:700,marginBottom:5}}>DTM SIMULYATORI</div>
          <h3 style={{fontSize:18,fontWeight:900,margin:"0 0 6px"}}>Real DTM formatida imtihon</h3>
          <p style={{color:th.sub,fontSize:13,marginBottom:16}}>70 savol · 3 soat · Ona tili + 2 yo'nalish fani</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10}} className="gridMob">{DTM_BLOCKS.map(b=><div key={b.name} className="card ch" onClick={()=>isPro?launch("dtm",b.name+" bloki",buildQs(b.subjects,b.counts,qBank),3*60*60):setScreen("pro")} style={{padding:"1rem",cursor:"pointer",borderColor:b.color+"25",position:"relative"}}>{!isPro&&<div style={{position:"absolute",top:8,right:8,fontSize:13}}>🔒</div>}<div style={{fontSize:22,marginBottom:5}}>{b.icon}</div><div style={{fontWeight:800,fontSize:13,color:b.color}}>{b.name}</div><div style={{fontSize:11,color:th.sub,lineHeight:1.4,marginTop:2}}>{b.desc}</div><div style={{fontSize:10,color:th.sub,marginTop:6,fontWeight:700}}>70 savol · 3 soat</div></div>)}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
          <div style={{...C,padding:"1.4rem",borderColor:"#1A85FF25"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><div style={{width:40,height:40,borderRadius:10,background:"#1A85FF15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:21}}>🔀</div><div><div style={{fontWeight:800,fontSize:14}}>Aralash Test</div><div style={{fontSize:11,color:th.sub}}>Fanlarni tanlang</div></div></div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:11}}>{SUBJECTS.map(s=>{const sel=mixConfig.subjects.includes(s.id);return<div key={s.id} onClick={()=>setMixConfig(c=>({...c,subjects:sel?c.subjects.filter(x=>x!==s.id):[...c.subjects,s.id]}))} style={{padding:"4px 9px",borderRadius:20,border:`1.5px solid ${sel?s.color:th.border}`,background:sel?s.color+"18":"transparent",color:sel?s.color:th.sub,fontSize:11,fontWeight:700,cursor:"pointer"}}>{s.icon} {s.short}</div>;})}</div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:10,color:th.sub,fontWeight:700,letterSpacing:1}}>SAVOLLAR</span><span style={{fontSize:12,fontWeight:800,color:"#1A85FF"}}>{mixConfig.count}</span></div>
            <input type="range" min={5} max={50} step={5} value={mixConfig.count} onChange={e=>setMixConfig(c=>({...c,count:+e.target.value}))} style={{accentColor:"#1A85FF",border:"none",background:"transparent",padding:0,marginBottom:12}} />
            <button className="mb" onClick={()=>{if(!mixConfig.subjects.length)return showFlash("Fan tanlang!","err");const p=Math.ceil(mixConfig.count/mixConfig.subjects.length);launch("mixed","Aralash Test",buildQs(mixConfig.subjects,mixConfig.subjects.map(()=>p),qBank).slice(0,mixConfig.count),mixConfig.count*60);}} style={{width:"100%",background:"#1A85FF",color:"#fff",borderColor:"#1A85FF",padding:"11px",fontSize:13,borderRadius:8}}>{t("start")} →</button>
          </div>
          <div style={{...C,padding:"1.4rem",borderColor:"#00C89625"}}><div style={{fontSize:24,marginBottom:8}}>🏃</div><div style={{fontWeight:800,fontSize:15,marginBottom:4}}>Marathon</div><div style={{fontSize:13,color:th.sub,marginBottom:12,lineHeight:1.6}}>Barcha fanlardan aralash · ~90 daqiqa</div><div style={{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap"}}>{SUBJECTS.map(s=><span key={s.id} style={{fontSize:14}}>{s.icon}</span>)}</div><button className="mb" onClick={()=>{if(!isPro)return setScreen("pro");const a=SUBJECTS.map(s=>s.id);launch("marathon","Marathon",buildQs(a,a.map(()=>5),qBank),a.length*5*90);}} style={{width:"100%",background:"#00C896",color:"#fff",borderColor:"#00C896",padding:"11px",fontSize:13,borderRadius:8}}>{isPro?"MARATHON →":"🔒 PRO"}</button></div>
          <div style={{...C,padding:"1.4rem",borderColor:"#FF8C0025"}}><div style={{fontSize:24,marginBottom:8}}>⚡</div><div style={{fontWeight:800,fontSize:15,marginBottom:4}}>Tezkor Test</div><div style={{fontSize:13,color:th.sub,marginBottom:12,lineHeight:1.6}}>20 savol · 10 daqiqa · Aralash</div><div style={{display:"flex",gap:6,marginBottom:12}}><span className="tag" style={{background:"#FF8C0018",color:"#FF8C00"}}>⏱ 10 daq</span><span className="tag" style={{background:th.soft,color:th.sub}}>20 savol</span></div><button className="mb" onClick={()=>{if(!isPro)return setScreen("pro");const a=SUBJECTS.map(s=>s.id);launch("speed","Tezkor ⚡",shuffleArr(buildQs(a,a.map(()=>2),qBank)).slice(0,20),10*60);}} style={{width:"100%",background:"#FF8C00",color:"#fff",borderColor:"#FF8C00",padding:"11px",fontSize:13,borderRadius:8}}>{isPro?"⚡ TEZKOR":"🔒 PRO"}</button></div>
          <div style={{...C,padding:"1.4rem",borderColor:"#7B2FBE25"}}><div style={{fontSize:24,marginBottom:8}}>🎲</div><div style={{fontWeight:800,fontSize:15,marginBottom:4}}>50 savollik test</div><div style={{fontSize:13,color:th.sub,marginBottom:12,lineHeight:1.6}}>Har fandan 4-5 ta · avtomatik generatsiya</div><div style={{display:"flex",gap:6,marginBottom:12}}><span className="tag" style={{background:"#7B2FBE18",color:"#7B2FBE"}}>🎲 Aralash</span><span className="tag" style={{background:th.soft,color:th.sub}}>50 savol</span></div><button className="mb" onClick={start50} style={{width:"100%",background:"#7B2FBE",color:"#fff",borderColor:"#7B2FBE",padding:"11px",fontSize:13,borderRadius:8}}>{isPro?"🎲 GENERATSIYA":"🔒 PRO"}</button></div>
          {customTests.map((tt,i)=>{const tq=tt.counts.reduce((a,c)=>a+c,0);return<div key={tt.id||i} className="card ch" style={{padding:"1.4rem",borderColor:tt.color+"30",cursor:"pointer"}} onClick={()=>launchCustom(tt)}><div style={{fontSize:24,marginBottom:8}}>{tt.icon}</div><div style={{fontWeight:800,fontSize:15,marginBottom:4,color:tt.color}}>{tt.title}</div>{tt.desc&&<div style={{fontSize:12,color:th.sub,marginBottom:8}}>{tt.desc}</div>}<div style={{display:"flex",gap:6,marginBottom:12}}><span className="tag" style={{background:tt.color+"18",color:tt.color}}>⏱ {tt.timeMin}daq</span><span className="tag" style={{background:th.soft,color:th.sub}}>{tq} savol</span></div><button className="mb" style={{width:"100%",background:tt.color,color:"#fff",borderColor:tt.color,padding:"10px",fontSize:12,borderRadius:8}}>{t("start")} →</button></div>;})}
        </div>
        {testHistory.length>0&&<div style={{...C,marginTop:16,padding:"1.4rem"}}><div style={{fontSize:10,color:th.sub,letterSpacing:3,fontWeight:700,marginBottom:12}}>📈 SO'NGGI TESTLAR</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8}}>{testHistory.slice(0,6).map((h,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:th.soft,borderRadius:8}}><div style={{width:30,height:30,borderRadius:7,background:gColor(h.pct)+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:gColor(h.pct),flexShrink:0}}>{grade(h.pct)}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.title}</div><div style={{fontSize:10,color:th.sub}}>{h.score}/{h.total} · {h.date}</div></div><div style={{fontSize:13,fontWeight:800,color:gColor(h.pct)}}>{h.pct}%</div></div>)}</div></div>}
      </div>
    </div>
  );

  // ════════ ANALYTICS ════════
  if(screen==="analytics")return(
    <div style={{minHeight:"100vh",background:th.bg,color:th.text,paddingBottom:"3rem",fontFamily:"var(--font-body)"}}>
      <style>{CSS}</style>
      <TopBar showBack title={"📊 "+t("analytics")} />
      <div style={{maxWidth:900,margin:"0 auto",padding:"2rem 1.25rem",animation:"fIn .4s"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:12,marginBottom:20}} className="gridMob">{[["O'rtacha",avgPct+"%","#2F54EB","📊"],["Testlar",testHistory.length,"#16A34A","📝"],["A+ baho",testHistory.filter(h=>h.pct>=90).length,"#F59E0B","🏆"],["Yaxshi fanlar",Object.values(completedTests).filter(d=>d.pct>=70).length,"#8B5CF6","⭐"]].map(([l,v,c,ic])=><div key={l} style={{...C,padding:"16px"}}><div style={{width:34,height:34,borderRadius:9,background:c+"1f",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,marginBottom:10}}>{ic}</div><div style={{fontSize:24,fontWeight:800,color:th.text}}>{v}</div><div style={{fontSize:12,color:th.sub,marginTop:1}}>{l}</div></div>)}</div>
        <div style={{...C,padding:"1.6rem",marginBottom:14}}><div style={{fontSize:10,color:th.sub,letterSpacing:3,fontWeight:700,marginBottom:16}}>FANLAR BO'YICHA</div>{SUBJECTS.map(s=>{const d=completedTests[s.id];return<div key={s.id} style={{display:"flex",alignItems:"center",gap:11,marginBottom:11}}><div style={{width:22,textAlign:"center",fontSize:15}}>{s.icon}</div><div style={{fontSize:12,fontWeight:700,width:100,flexShrink:0,color:th.sub}}>{s.name}</div><div style={{flex:1,background:th.soft,borderRadius:4,height:9,overflow:"hidden"}}><div style={{height:"100%",width:d?`${d.pct}%`:"0%",background:`linear-gradient(90deg,${s.color},${s.color}80)`,borderRadius:4,transition:"width .5s"}} /></div><div style={{width:40,textAlign:"right",fontSize:13,fontWeight:800,color:d?gColor(d.pct):th.faint}}>{d?d.pct+"%":"—"}</div><div style={{width:28,textAlign:"center",fontSize:12,fontWeight:700,color:d?gColor(d.pct):th.faint}}>{d?grade(d.pct):"—"}</div></div>;})}</div>
        {Object.values(completedTests).some(d=>d.pct<70)&&<div style={{...C,padding:"1.6rem"}}><div style={{fontSize:10,color:th.sub,letterSpacing:3,fontWeight:700,marginBottom:14}}>🔔 TAVSIYALAR</div>{SUBJECTS.filter(s=>completedTests[s.id]&&completedTests[s.id].pct<70).map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:11,padding:"10px 14px",background:"var(--a08)",border:"1px solid var(--a20)",borderRadius:8,marginBottom:8}}><span style={{fontSize:19}}>{s.icon}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700}}>{s.name} — <span style={{color:"var(--accent)"}}>{completedTests[s.id].pct}%</span></div><div style={{fontSize:12,color:th.sub}}>Ko'proq mashq tavsiya etiladi</div></div><button className="mb" onClick={()=>launch("subject",s.name,buildQs([s.id],null,qBank),null,s.id)} style={{background:"transparent",color:"var(--accent)",borderColor:"var(--a40)",padding:"7px 13px",fontSize:11,borderRadius:6}}>MASHQ →</button></div>)}</div>}
      </div>
    </div>
  );

  // ════════ TEST ════════
  if(screen==="test"&&activeTest){
    const qs=activeTest.questions;
    const q=qs[tIdx];
    const cs=q?sObj(q.subjectId):null;
    const tl=activeTest.timeLimit;
    const tPct=tl?(timeLeft/tl)*100:100;
    const tColor=tPct>50?"#00C896":tPct>20?"#FF8C00":"var(--accent)";
    const sc=qs.filter((qq,i)=>isCorrect(qq,answers[i])).length;
    const isDTM=activeTest.type==="dtm";
    const bm=q&&bookmarks.some(x=>x.id===q.id);

    // ── REVIEW MODE ──
    if(reviewMode){
      return(
        <div style={{minHeight:"100vh",background:th.bg,color:th.text,fontFamily:"var(--font-body)",paddingBottom:"3rem"}}>
          <style>{CSS}</style>
          <div style={{background:th.nav,borderBottom:`1px solid ${th.border}`,padding:"0 1.25rem",height:56,position:"sticky",top:0,zIndex:100}}><div style={{maxWidth:720,margin:"0 auto",height:"100%",display:"flex",alignItems:"center",gap:10}}><button className="mb" onClick={()=>setReviewMode(false)} style={{background:"transparent",color:th.text,borderColor:th.border,padding:"7px 12px",fontSize:11,borderRadius:6}}>← {t("back")}</button><span style={{fontWeight:800,fontSize:14}}>📖 {t("review")}</span><span style={{marginLeft:"auto",fontSize:13,fontWeight:700,color:gColor(Math.round(sc/qs.length*100))}}>{sc}/{qs.length}</span></div></div>
          <div style={{maxWidth:720,margin:"0 auto",padding:"1.5rem 1.25rem"}}>
            {qs.map((qq,i)=>{const ok=isCorrect(qq,answers[i]);const ua=answers[i];const s=sObj(qq.subjectId);return(
              <div key={i} className="card" style={{padding:"1.3rem",marginBottom:12,borderColor:ok?"#00C89630":"var(--a30)",animation:"fIn .3s"}}>
                <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{width:26,height:26,borderRadius:"50%",background:ok?"#00C89620":"var(--a20)",color:ok?"#00C896":"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,flexShrink:0}}>{ok?"✓":"✗"}</span>
                  <span style={{fontSize:12,color:th.sub,fontWeight:700}}>#{i+1}</span>
                  {s&&<span className="tag" style={{background:s.color+"15",color:s.color,fontSize:10}}>{s.icon} {s.name}</span>}
                  <span className="tag" style={{background:DIFF[qq.diff]?.color+"15",color:DIFF[qq.diff]?.color,fontSize:10}}>{DIFF[qq.diff]?.label}</span>
                </div>
                <div style={{fontSize:15,fontWeight:700,marginBottom:12,lineHeight:1.5}}>{qq.q}</div>
                {qq.o.map((opt,j)=>{const corr=qq.multi?qq.a.includes(j):qq.a===j;const chosen=qq.multi?(ua||[]).includes(j):ua===j;return<div key={j} style={{padding:"9px 13px",borderRadius:7,marginBottom:6,fontSize:13,border:`1.5px solid ${corr?"#00C896":chosen?"var(--accent)":th.border}`,background:corr?"#00C89612":chosen?"var(--a12)":"transparent",display:"flex",alignItems:"center",gap:8}}><span style={{fontWeight:800,color:corr?"#00C896":chosen?"var(--accent)":th.sub}}>{String.fromCharCode(65+j)}</span><span style={{flex:1,color:th.text}}>{opt}</span>{corr&&<span style={{fontSize:11,color:"#00C896",fontWeight:700}}>✓ {t("correctAnswer")}</span>}{chosen&&!corr&&<span style={{fontSize:11,color:"var(--accent)",fontWeight:700}}>✗ {t("yourAnswer")}</span>}</div>;})}
                {qq.exp&&<div style={{marginTop:10,padding:"10px 13px",background:"#4F6EF710",border:"1px solid #4F6EF725",borderRadius:7,fontSize:13,color:th.text}}><b style={{color:"#4F6EF7"}}>💡 {t("explanation")}:</b> {qq.exp}</div>}
              </div>
            );})}
            <button className="mb" onClick={()=>setScreen("dashboard")} style={{width:"100%",background:"var(--accent)",color:"#fff",borderColor:"var(--accent)",padding:"13px",fontSize:13,borderRadius:8,marginTop:8}}>{t("dashboard")} →</button>
          </div>
        </div>
      );
    }

    // ── RESULT ──
    if(testDone){
      const fp=Math.round((sc/qs.length)*100);
      const multi=SUBJECTS.filter(s=>qs.some(qq=>qq.subjectId===s.id));
      return(
        <div style={{minHeight:"100vh",background:th.bg,color:th.text,display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem",fontFamily:"var(--font-body)"}}>
          <style>{CSS}</style>
          {fp>=80&&<Confetti />}
          <div style={{maxWidth:560,width:"100%",textAlign:"center",animation:"pop .4s"}}>
            {timeUp&&<div style={{background:"var(--a15)",border:"1px solid var(--a40)",borderRadius:8,padding:"9px",marginBottom:18,fontSize:12,color:"var(--accent)",fontWeight:700}}>⏰ Vaqt tugadi!</div>}
            <div style={{fontSize:64,marginBottom:10}}>{fp>=90?"🏆":fp>=70?"🥈":"📖"}</div>
            <div style={{fontSize:10,color:th.sub,letterSpacing:4,marginBottom:6}}>{t("result").toUpperCase()}</div>
            <div style={{fontSize:48,fontWeight:900,color:cs?.color||"var(--accent)"}}>{fp}%</div>
            <div style={{fontSize:60,fontWeight:900,lineHeight:1,marginBottom:6}}>{grade(fp)}</div>
            <div style={{color:th.sub,marginBottom:22,fontSize:14}}>{sc}/{qs.length} {t("correct")} · {activeTest.title}</div>
            {multi.length>1&&<div className="card" style={{padding:"1.2rem",marginBottom:20,textAlign:"left"}}><div style={{fontSize:10,color:th.sub,letterSpacing:3,fontWeight:700,marginBottom:12}}>FANLAR BO'YICHA</div>{multi.map(s=>{const sq=qs.filter(qq=>qq.subjectId===s.id);const ssc=sq.filter(qq=>{const gi=qs.indexOf(qq);return isCorrect(qq,answers[gi]);}).length;const sp=Math.round(ssc/sq.length*100);return<div key={s.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><span style={{fontSize:15}}>{s.icon}</span><div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:12,fontWeight:700,color:th.sub}}>{s.name}</span><span style={{fontSize:12,color:s.color,fontWeight:700}}>{ssc}/{sq.length} ({sp}%)</span></div><div style={{background:th.soft,borderRadius:4,height:5,overflow:"hidden"}}><div style={{height:"100%",width:`${sp}%`,background:s.color}} /></div></div></div>;})}</div>}
            <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
              <button className="mb" onClick={()=>setReviewMode(true)} style={{background:"#4F6EF7",color:"#fff",borderColor:"#4F6EF7",padding:"11px 20px",fontSize:13,borderRadius:8}}>📖 {t("review")}</button>
              <button className="mb" onClick={()=>{setTIdx(0);setAnswers({});setTestDone(false);setReviewMode(false);setTimeUp(false);resetTimer(tl||0);if(tl)setTimeout(()=>setTimerOn(true),100);}} style={{background:"transparent",color:th.text,borderColor:th.border,padding:"11px 20px",fontSize:13,borderRadius:8}}>{t("retry")}</button>
              <button className="mb" onClick={()=>setScreen("dashboard")} style={{background:"var(--accent)",color:"#fff",borderColor:"var(--accent)",padding:"11px 20px",fontSize:13,borderRadius:8}}>{t("dashboard")} →</button>
            </div>
          </div>
        </div>
      );
    }

    // ── TEST IN PROGRESS ──
    const ans=answers[tIdx];
    return(
      <div style={{minHeight:"100vh",background:th.bg,color:th.text,fontFamily:"var(--font-body)"}}>
        <style>{CSS}</style>
        <div style={{background:th.nav,borderBottom:`1px solid ${th.border}`,padding:"0 1.25rem",position:"sticky",top:0,zIndex:100}}>
          <div style={{maxWidth:720,margin:"0 auto",height:54,display:"flex",alignItems:"center",gap:12}}>
            <button className="mb" onClick={()=>{setTimerOn(false);setScreen("dashboard");}} style={{background:"transparent",color:th.text,borderColor:th.border,padding:"7px 12px",fontSize:11,borderRadius:6}}>← {t("logout")}</button>
            <div style={{flex:1,minWidth:0}}><div style={{fontWeight:800,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activeTest.title}</div>{cs&&<div style={{fontSize:10,color:cs.color}}>{cs.icon} {cs.name}</div>}</div>
            {tl>0&&<div style={{background:th.soft,borderRadius:20,padding:"5px 12px",border:`1.5px solid ${tColor}35`}}><span style={{fontSize:14,fontWeight:900,color:tColor,fontVariantNumeric:"tabular-nums"}}>{fmtTime(timeLeft)}</span></div>}
            <div style={{fontSize:12,color:th.sub,fontWeight:700}}>{tIdx+1}/{qs.length}</div>
          </div>
          <div style={{height:3,background:th.soft}}><div style={{height:"100%",width:`${(tIdx+1)/qs.length*100}%`,background:cs?.color||"var(--accent)",transition:"width .4s"}} /></div>
          {tl>0&&<div style={{height:2,background:th.soft}}><div style={{height:"100%",width:`${tPct}%`,background:tColor,transition:"width 1s linear"}} /></div>}
        </div>
        <div style={{maxWidth:680,margin:"0 auto",padding:"1.5rem 1.25rem",animation:"fIn .25s"}}>
          <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
            {isDTM&&<span style={{background:cs?.color+"18",border:`1px solid ${cs?.color}30`,color:cs?.color,fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20}}>{cs?.name} bloki</span>}
            {q.multi&&<span style={{background:"#4F6EF718",color:"#4F6EF7",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20}}>Ko'p javobli</span>}
            <span style={{background:DIFF[q.diff]?.color+"15",color:DIFF[q.diff]?.color,fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20}}>{DIFF[q.diff]?.label}</span>
            <button onClick={()=>toggleBookmark(q)} style={{marginLeft:"auto",background:bm?"#FF8C0020":th.soft,border:`1px solid ${bm?"#FF8C00":th.border}`,color:bm?"#FF8C00":th.sub,padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:700,cursor:"pointer"}}>{bm?"🔖 "+t("bookmarked"):"🔖 "+t("bookmark")}</button>
          </div>
          <div className="card" style={{padding:"1.5rem",marginBottom:16,borderColor:(cs?.color||"var(--accent)")+"20"}}><div style={{fontSize:10,color:cs?.color||"var(--accent)",fontWeight:700,letterSpacing:2,marginBottom:12}}>SAVOL {tIdx+1}{q.multi?" (bir nechta to'g'ri javob)":""}</div><div style={{fontSize:17,fontWeight:700,lineHeight:1.6}}>{q.q}</div></div>
          <div>{q.o.map((opt,i)=>{const sel=q.multi?(ans||[]).includes(i):ans===i;return<button key={i} className={`opt${sel?" osel":""}`} onClick={()=>selectAns(tIdx,i,q.multi)}><span style={{display:"inline-flex",width:24,height:24,borderRadius:q.multi?6:"50%",background:sel?(cs?.color||"var(--accent)"):th.soft,color:sel?"#fff":th.sub,alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,marginRight:11,flexShrink:0,transition:"all .12s"}}>{sel&&q.multi?"✓":String.fromCharCode(65+i)}</span>{opt}</button>;})}</div>
          <div style={{display:"flex",gap:9,marginTop:18,justifyContent:"space-between",alignItems:"center"}}>
            <button className="mb" onClick={()=>setTIdx(i=>i-1)} disabled={tIdx===0} style={{background:"transparent",color:tIdx===0?th.faint:th.text,borderColor:th.border,padding:"10px 18px",fontSize:13,borderRadius:8}}>← {t("prev")}</button>
            <div style={{fontSize:11,color:th.sub}}>{Object.keys(answers).filter(k=>{const a=answers[k];return Array.isArray(a)?a.length:a!==undefined;}).length}/{qs.length}</div>
            {tIdx<qs.length-1?<button className="mb" onClick={()=>setTIdx(i=>i+1)} style={{background:cs?.color||"var(--accent)",color:"#fff",borderColor:cs?.color||"var(--accent)",padding:"10px 18px",fontSize:13,borderRadius:8}}>{t("next")} →</button>:<button className="mb" onClick={submitTest} style={{background:"#00C896",color:"#fff",borderColor:"#00C896",padding:"10px 18px",fontSize:13,borderRadius:8}}>{t("finish")} ✓</button>}
          </div>
          <div style={{display:"flex",gap:4,marginTop:18,flexWrap:"wrap",justifyContent:"center"}}>{qs.map((_,i)=>{const ic=sObj(qs[i].subjectId);const a=answers[i];const answered=Array.isArray(a)?a.length:a!==undefined;return<div key={i} onClick={()=>setTIdx(i)} style={{width:28,height:28,borderRadius:5,border:`1.5px solid ${i===tIdx?(ic?.color||"var(--accent)"):answered?th.border:th.soft}`,background:i===tIdx?(ic?.color||"var(--accent)")+"18":answered?th.soft:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:i===tIdx?(ic?.color||"var(--accent)"):answered?th.text:th.faint,transition:"all .12s"}}>{i+1}</div>;})}</div>
          {Object.keys(answers).length>=Math.ceil(qs.length*.5)&&<div style={{textAlign:"center",marginTop:16}}><button className="mb" onClick={submitTest} style={{background:"transparent",color:"#00C896",borderColor:"#00C89635",padding:"9px 18px",fontSize:11,borderRadius:8}}>Erta {t("finish").toLowerCase()}</button></div>}
        </div>
      </div>
    );
  }

  return <div style={{minHeight:"100vh",background:th.bg,color:th.text,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-body)"}}><style>{CSS}</style><button className="mb" onClick={()=>setScreen(user?"dashboard":"auth")} style={{background:"var(--accent)",color:"#fff",borderColor:"var(--accent)",padding:"13px 26px",fontSize:14,borderRadius:8}}>{user?t("dashboard"):t("login")} →</button></div>;
}

// ═══════════════ ERROR BOUNDARY ═══════════════
class ErrorBoundary extends Component {
  constructor(p){ super(p); this.state={err:null}; }
  static getDerivedStateFromError(err){ return {err}; }
  componentDidCatch(err,info){ console.error("Ilova xatosi:",err,info); }
  render(){
    if(this.state.err){
      return (
        <div style={{minHeight:"100vh",background:"#070710",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem",fontFamily:"var(--font-body)",textAlign:"center"}}>
          <div style={{maxWidth:420}}>
            <div style={{fontSize:48,marginBottom:14}}>😵</div>
            <h2 style={{fontSize:22,fontWeight:900,margin:"0 0 10px"}}>Nimadir noto'g'ri ketdi</h2>
            <p style={{color:"#889",fontSize:14,lineHeight:1.7,marginBottom:18}}>Ilovada kutilmagan xato yuz berdi. Sahifani yangilab ko'ring. Agar takrorlansa, Supabase kalitlari to'g'ri qo'yilganini tekshiring.</p>
            <pre style={{background:"#0D0D1A",border:"1px solid #1E1E30",borderRadius:8,padding:"10px",fontSize:11,color:"var(--accent)",textAlign:"left",overflow:"auto",maxHeight:120}}>{String(this.state.err?.message||this.state.err)}</pre>
            <button onClick={()=>window.location.reload()} style={{marginTop:16,background:"var(--accent)",color:"#fff",border:"none",padding:"12px 24px",fontSize:13,fontWeight:800,borderRadius:8,cursor:"pointer"}}>SAHIFANI YANGILASH</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App(){
  return <ErrorBoundary><AppInner /></ErrorBoundary>;
}
