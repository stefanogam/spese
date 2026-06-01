# Spese Mensili - PWA locale v13

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


## Modifiche v8

- La Home mostra chiaramente la versione **V.8**.
- All'apertura e quando si torna alla Home viene visualizzato il mese corrente.
- Nella sezione Aggiungi, la data viene reimpostata automaticamente al giorno corrente.
- Nella sezione Soglie, il budget mensile totale è calcolato automaticamente come somma delle soglie delle categorie.


## Modifiche V.13

- In Home è stato aggiunto un selettore mese.
- La Home si apre sempre sul mese corrente, ma consente di scegliere tutti i mesi in cui è presente almeno una spesa.
- Nella sezione Report è stato aggiunto un report plurimensile.
- Il report plurimensile usa un mese di riferimento e visualizza i 6 mesi precedenti e i 6 mesi successivi.
- Sono presenti pulsanti -6 mesi, mese corrente e +6 mesi.
- Il grafico mostra istogrammi impilati per categoria/soglia e una linea del totale mensile.


## Correzione V.13

Corretto un problema di navigazione dal menu basso: in V.9 lo script poteva interrompersi perché cercava i pulsanti `prevMonthButton` e `nextMonthButton`, rimossi dalla Home. Ora i listener sono protetti e il menu basso cambia correttamente sezione.


## Correzione V.13

Corretto l'errore JavaScript che bloccava l'app:

`document.getElementById("selectedMonthLabel")?.textContent = ...`

L'assegnazione con optional chaining non è valida in JavaScript. Ora il codice verifica prima l'esistenza dell'elemento e poi aggiorna il testo. Questo permette allo script di caricarsi correttamente e al menu basso di funzionare.


## Modifiche V.13

Nel report plurimensile sono state aggiunte due combo box:

- **Mesi precedenti**, valori da 0 a 12;
- **Mesi successivi**, valori da 0 a 12.

Il valore predefinito è 0 per entrambe. Il pulsante "Torna al mese corrente" riporta il mese di riferimento al mese corrente e reimposta entrambe le combo a 0.


## Modifiche V.13

Ottimizzato il grafico plurimensile:

- il primo mese visualizzato parte allineato a sinistra dell'area grafico;
- ridotto lo spazio vuoto iniziale;
- mantenuta la linea del totale mensile centrata sulle barre.
