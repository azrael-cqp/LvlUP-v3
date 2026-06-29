# DEPLOY SOLO LEVELING SYSTEM v3.1

Update cu toate cele 20 de modificari (remindere, boss noi, fail-set, swap real, analize, bug fix).

---

## FISIERE NECESARE (2)

```
1. index.html          ← Pagina principala (neschimbata fata de v3.0)
2. app.compiled.js     ← Aplicatia noua (toate modificarile sunt aici)
```

Doar `app.compiled.js` s-a schimbat. `index.html` e identic cu cel de dinainte — il poti lasa asa cum e in repo SAU il reincarci la fel, nu conteaza.

---

## PASI DEPLOY (repo existent LvlUP-v3)

### PAS 1 (recomandat) — Backup date INAINTE
```
1. Deschide app-ul VECHI (URL-ul actual)
2. Tab SAVE → "EXPORT SAVE CODE"
3. Copiaza codul base64 → salveaza-l in Notes / mail catre tine
```
(Daca ramai pe acelasi domeniu azrael-cqp.github.io, datele raman in IndexedDB oricum. Backup-ul e plasa de siguranta.)

### PAS 2 — Inlocuieste app.compiled.js
```
1. github.com/azrael-cqp/LvlUP-v3
2. Click pe app.compiled.js (cel vechi)
3. Sus dreapta: iconita "..." → "Delete file" → Commit
4. Apoi: "Add file" → "Upload files"
5. DRAG & DROP app.compiled.js cel nou (NU paste continutul!)
6. Commit: "v3.1 - 20 updates"
```

### PAS 3 (optional) — index.html
Daca vrei sa fii 100% sigur, reincarca si index.html la fel (drag & drop). Dar fiind neschimbat, nu e obligatoriu.

### PAS 4 — Test
```
1. Asteapta 2-3 min (GitHub Pages rebuild)
2. iPhone: Settings → Safari → Clear History and Website Data
3. Deschide: https://azrael-cqp.github.io/LvlUP-v3/
```

---

## CHECKLIST DUPA DEPLOY (testeaza in ordinea asta)

```
□ App porneste fara ecran rosu "APP CRASHED"
□ Tab QUESTS — vezi quest-urile (fara LEARN, fara SOCIAL in bara de jos)
□ Tab PPL → tap "▸ Log sets" pe un exercitiu
   □ Loghezi un set → apesi ▶ → BUG TEST: valorile NU se reseteaza
   □ Apesi pe ✓ la setul logat → se redeschide pentru editare (debifare)
   □ "🔥 + FAIL SET" → apare rand rosu cu greutate redusa, editabil
   □ Butonul de fail (💀/○) e mare, usor de apasat
□ Tap "🔄 Swap" pe un exercitiu → alegi alternativa → CHIAR se schimba exercitiul
   □ La exercitiul schimbat apare "🔄 Swapped" → poti reveni la original
□ Dips NU mai apare nicaieri
□ Treadmill: scrie "doar ce e in taskuri" (fara +1HR)
□ Sub exercitii: VOLUM SAPTAMANA (seturi/grupa)
□ Daca un exercitiu e blocat 3 sesiuni → alerta galbena "Plateau"
□ Tab BOSS — vezi 9 boss-uri (inclusiv The Stiff Shadow + The Plateau Demon)
   □ Accepti un boss → in tab QUESTS sus apar quest-urile lui zilnice
□ Tab BODY — vezi: Trend 7 zile, Lean mass watch, Somn↔masa
□ La deschidere: reminder somn (daca n-ai logat noaptea trecuta)
□ Joia: reminder greutate+BF
```

---

## DACA DATELE DISPAR
```
Tab SAVE → "IMPORT SAVE" → lipesti codul base64 din backup → Confirm
```

---

## DACA APARE EROARE
Trimite screenshot la ecranul rosu de crash (are mesajul + linia). Rezolv pe loc.

Spor!
