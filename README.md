# Spese Mensili - PWA locale v16

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

- La Home mostra chiaramente la versione **V.25**.
- All'apertura e quando si torna alla Home viene visualizzato il mese corrente.
- Nella sezione Aggiungi, la data viene reimpostata automaticamente al giorno corrente.
- Nella sezione Soglie, il budget mensile totale è calcolato automaticamente come somma delle soglie delle categorie.


## Modifiche V.25

- In Home è stato aggiunto un selettore mese.
- La Home si apre sempre sul mese corrente, ma consente di scegliere tutti i mesi in cui è presente almeno una spesa.
- Nella sezione Report è stato aggiunto un report plurimensile.
- Il report plurimensile usa un mese di riferimento e visualizza i 6 mesi precedenti e i 6 mesi successivi.
- Sono presenti pulsanti -6 mesi, mese corrente e +6 mesi.
- Il grafico mostra istogrammi impilati per categoria/soglia e una linea del totale mensile.


## Correzione V.25

Corretto un problema di navigazione dal menu basso: in V.25 lo script poteva interrompersi perché cercava i pulsanti `prevMonthButton` e `nextMonthButton`, rimossi dalla Home. Ora i listener sono protetti e il menu basso cambia correttamente sezione.


## Correzione V.25

Corretto l'errore JavaScript che bloccava l'app:

`document.getElementById("selectedMonthLabel")?.textContent = ...`

L'assegnazione con optional chaining non è valida in JavaScript. Ora il codice verifica prima l'esistenza dell'elemento e poi aggiorna il testo. Questo permette allo script di caricarsi correttamente e al menu basso di funzionare.


## Modifiche V.25

Nel report plurimensile sono state aggiunte due combo box:

- **Mesi precedenti**, valori da 0 a 12;
- **Mesi successivi**, valori da 0 a 12.

Il valore predefinito è 0 per entrambe. Il pulsante "Torna al mese corrente" riporta il mese di riferimento al mese corrente e reimposta entrambe le combo a 0.


## Modifiche V.25

Ottimizzato il grafico plurimensile:

- il primo mese visualizzato parte allineato a sinistra dell'area grafico;
- ridotto lo spazio vuoto iniziale;
- mantenuta la linea del totale mensile centrata sulle barre.


## Modifiche V.25

Aggiunto il metodo di pagamento **Voucher**.

Logica introdotta:

- una spesa pagata con Voucher resta registrata nella categoria corretta;
- la spesa appare nella lista spese e nei totali registrati;
- la spesa Voucher non incide sul budget mensile utilizzato;
- la spesa Voucher non incide sulle soglie di categoria;
- Dashboard e Report mostrano separatamente:
  - budget utilizzato;
  - totale spese registrate;
  - totale voucher esclusi dal budget.

Esempio: 50 € di gasolio con metodo Voucher risultano nella categoria Trasporti, ma non riducono il budget disponibile.


## Modifiche V.25

Aggiunta la possibilità di modificare le spese già inserite dalla sezione **Spese**.

Per ogni spesa sono ora disponibili:

- **Modifica**;
- **Elimina**.

La modifica permette di aggiornare:

- importo;
- categoria;
- data;
- metodo di pagamento;
- descrizione.

Per le spese plurimensili, la modifica riguarda la singola quota visualizzata.


## Modifiche V.25

Migliorata la gestione delle spese plurimensili.

Nella lista spese, per ogni quota plurimensile viene ora visualizzato anche:

- **Importo complessivo** della spesa originaria.

In fase di modifica di una quota plurimensile è ora possibile:

- modificare solo la singola quota;
- applicare categoria, metodo di pagamento e descrizione a tutte le quote collegate;
- modificare l'importo complessivo e ridistribuirlo automaticamente su tutte le quote collegate.

Nota: la data resta specifica della singola quota. Per ripianificare tutte le date conviene eliminare e reinserire la spesa plurimensile.


## Correzione V.25

Versione ricostruita sulla base stabile V.25.

Correzioni principali:

- ripristino corretto della gestione categorie;
- ripristino aggiunta categorie;
- ripristino modifica note/descrizione delle spese;
- mantenute spese plurimensili, importo complessivo e modifica quote collegate;
- mantenuta logica Voucher;
- corretta generazione ID con fallback sicuro;
- aggiunta migrazione da V.25/V.25 senza usare la logica instabile della V.25.


## Correzione V.25

Corretta la regressione della V.25:

- dichiarata correttamente la costante `APP_VERSION`;
- riallineata la chiave di salvataggio a `spese-pwa-locale-v20`;
- mantenuta la base stabile V.25/V.25;
- mantenuta la migrazione dalle versioni precedenti.


## Correzione V.25

Corretta la funzione mancante `renderExpensesMonthSelect()`, che bloccava l'app all'avvio e impediva il caricamento di categorie, spese e funzioni di modifica.


## Correzione V.25

Rimossa completamente la dipendenza dalla funzione `renderExpensesMonthSelect()`.

La logica del filtro mese nella sezione Spese è ora integrata direttamente in `renderExpensesList()`, così l'app non può più bloccarsi all'avvio per quella funzione mancante.


## Modifiche V.25

Nella Home la sintesi del mese è stata resa più chiara:

- **Spese registrate**: totale di tutte le spese inserite, compresi i voucher;
- **Spese escluse i voucher**: totale che incide sul budget;
- **Di cui voucher**: totale delle spese pagate con voucher.


## Modifiche V.25

Nella Home sono ora visualizzate esplicitamente tre righe distinte:

- **Spese registrate**;
- **Spese escluse i voucher**;
- **Di cui voucher**.

Il valore principale della card resta "Spese escluse i voucher", cioè il totale che incide sul budget.


## Modifiche V.25

Nella Home, la sezione **Ultime spese** è ora esplicitamente solo consultiva:

- non mostra il pulsante **Modifica**;
- non mostra il pulsante **Elimina**.

La modifica e l'eliminazione restano disponibili nella sezione **Spese**.
