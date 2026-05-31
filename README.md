# Spese Mensili - PWA locale v7

Questa versione include:

- inserimento spese;
- spese plurimensili con suddivisione automatica su più mesi;
- categorie modificabili;
- aggiunta, rinomina ed eliminazione categorie non usate;
- soglie mensili e per categoria;
- dashboard e report;
- selezione del mese nella sezione report, con elenco limitato ai soli mesi con spese registrate;
- esportazione CSV del mese selezionato;
- esportazione backup JSON;
- importazione backup JSON;
- manifest PWA;
- service worker per uso offline.

## Backup JSON

Nella sezione **Soglie > Backup** trovi:

- **Esporta backup JSON**: scarica un file con spese, categorie e soglie.
- **Importa backup JSON**: ripristina un backup precedente.

Puoi salvare il file JSON su Google Drive dal telefono.

## Pubblicazione

Per usare la PWA su Android, pubblica questi file su GitHub Pages, Netlify, Vercel o altro hosting HTTPS.


## Correzione v5

Corretto il calcolo delle spese plurimensili per le date di fine mese.

Esempio:

- spesa registrata il 31/05;
- durata: 2 mesi.

Ora l'app genera correttamente:

- 31/05;
- 30/06.

Prima, a causa del comportamento standard delle date JavaScript, 31/05 + 1 mese poteva diventare luglio.


## Correzione v6

La generazione delle spese plurimensili ora separa:

- mese contabile della quota;
- data visualizzata della quota.

Esempio:

- data iniziale: 31/05/2026
- durata: 2 mesi

Risultato:

- quota 1: mese 2026-05, data 2026-05-31
- quota 2: mese 2026-06, data 2026-06-30

Questo impedisce qualsiasi slittamento contabile a luglio.

È stato anche aggiornato il service worker con `skipWaiting()` e `clients.claim()` per ridurre il rischio che Android continui a usare una versione precedente in cache.


## Modifica v7

Aggiunto filtro mese anche nella sezione **Spese**.

La tendina mostra solo i mesi in cui sono presenti spese registrate.
La lista spese e l'esportazione CSV usano il mese selezionato in questa sezione.
