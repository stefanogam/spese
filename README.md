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

- La Home mostra chiaramente la versione **V.49**.
- All'apertura e quando si torna alla Home viene visualizzato il mese corrente.
- Nella sezione Aggiungi, la data viene reimpostata automaticamente al giorno corrente.
- Nella sezione Soglie, il budget mensile totale è calcolato automaticamente come somma delle soglie delle categorie.


## Modifiche V.49

- In Home è stato aggiunto un selettore mese.
- La Home si apre sempre sul mese corrente, ma consente di scegliere tutti i mesi in cui è presente almeno una spesa.
- Nella sezione Report è stato aggiunto un report plurimensile.
- Il report plurimensile usa un mese di riferimento e visualizza i 6 mesi precedenti e i 6 mesi successivi.
- Sono presenti pulsanti -6 mesi, mese corrente e +6 mesi.
- Il grafico mostra istogrammi impilati per categoria/soglia e una linea del totale mensile.


## Correzione V.49

Corretto un problema di navigazione dal menu basso: in V.49 lo script poteva interrompersi perché cercava i pulsanti `prevMonthButton` e `nextMonthButton`, rimossi dalla Home. Ora i listener sono protetti e il menu basso cambia correttamente sezione.


## Correzione V.49

Corretto l'errore JavaScript che bloccava l'app:

`document.getElementById("selectedMonthLabel")?.textContent = ...`

L'assegnazione con optional chaining non è valida in JavaScript. Ora il codice verifica prima l'esistenza dell'elemento e poi aggiorna il testo. Questo permette allo script di caricarsi correttamente e al menu basso di funzionare.


## Modifiche V.49

Nel report plurimensile sono state aggiunte due combo box:

- **Mesi precedenti**, valori da 0 a 12;
- **Mesi successivi**, valori da 0 a 12.

Il valore predefinito è 0 per entrambe. Il pulsante "Torna al mese corrente" riporta il mese di riferimento al mese corrente e reimposta entrambe le combo a 0.


## Modifiche V.49

Ottimizzato il grafico plurimensile:

- il primo mese visualizzato parte allineato a sinistra dell'area grafico;
- ridotto lo spazio vuoto iniziale;
- mantenuta la linea del totale mensile centrata sulle barre.


## Modifiche V.49

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


## Modifiche V.49

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


## Modifiche V.49

Migliorata la gestione delle spese plurimensili.

Nella lista spese, per ogni quota plurimensile viene ora visualizzato anche:

- **Importo complessivo** della spesa originaria.

In fase di modifica di una quota plurimensile è ora possibile:

- modificare solo la singola quota;
- applicare categoria, metodo di pagamento e descrizione a tutte le quote collegate;
- modificare l'importo complessivo e ridistribuirlo automaticamente su tutte le quote collegate.

Nota: la data resta specifica della singola quota. Per ripianificare tutte le date conviene eliminare e reinserire la spesa plurimensile.


## Correzione V.49

Versione ricostruita sulla base stabile V.49.

Correzioni principali:

- ripristino corretto della gestione categorie;
- ripristino aggiunta categorie;
- ripristino modifica note/descrizione delle spese;
- mantenute spese plurimensili, importo complessivo e modifica quote collegate;
- mantenuta logica Voucher;
- corretta generazione ID con fallback sicuro;
- aggiunta migrazione da V.49/V.49 senza usare la logica instabile della V.49.


## Correzione V.49

Corretta la regressione della V.49:

- dichiarata correttamente la costante `APP_VERSION`;
- riallineata la chiave di salvataggio a `spese-pwa-locale-v20`;
- mantenuta la base stabile V.49/V.49;
- mantenuta la migrazione dalle versioni precedenti.


## Correzione V.49

Corretta la funzione mancante `renderExpensesMonthSelect()`, che bloccava l'app all'avvio e impediva il caricamento di categorie, spese e funzioni di modifica.


## Correzione V.49

Rimossa completamente la dipendenza dalla funzione `renderExpensesMonthSelect()`.

La logica del filtro mese nella sezione Spese è ora integrata direttamente in `renderExpensesList()`, così l'app non può più bloccarsi all'avvio per quella funzione mancante.


## Modifiche V.49

Nella Home la sintesi del mese è stata resa più chiara:

- **Spese registrate**: totale di tutte le spese inserite, compresi i voucher;
- **Spese escluse i voucher**: totale che incide sul budget;
- **Di cui voucher**: totale delle spese pagate con voucher.


## Modifiche V.49

Nella Home sono ora visualizzate esplicitamente tre righe distinte:

- **Spese registrate**;
- **Spese escluse i voucher**;
- **Di cui voucher**.

Il valore principale della card resta "Spese escluse i voucher", cioè il totale che incide sul budget.


## Modifiche V.49

Nella Home, la sezione **Ultime spese** è ora esplicitamente solo consultiva:

- non mostra il pulsante **Modifica**;
- non mostra il pulsante **Elimina**.

La modifica e l'eliminazione restano disponibili nella sezione **Spese**.


## Modifiche V.49

Aggiunta la gestione dei **rimborsi generici per categoria**.

Esempio: puoi inserire un rimborso di 30 € nella categoria Trasporti anche se non è collegato a una spesa specifica.

Il rimborso generico:

- ha importo, categoria, data e descrizione;
- riduce il budget utilizzato della categoria scelta;
- appare nella sezione **Spese** in una lista separata;
- può essere eliminato;
- viene considerato in Home, Report mensile, Report plurimensile ed export CSV.


## Modifiche V.49

La gestione dei rimborsi generici è stata integrata direttamente in **Aggiungi spesa**.

Ora nella maschera di inserimento c'è il flag:

- **Questo inserimento è un rimborso generico**

Se il flag è attivo:

- l'importo viene salvato come rimborso generico;
- la categoria scelta determina da quale budget sottrarre il rimborso;
- metodo pagamento e plurimensile vengono nascosti;
- non serve una sezione separata.

Se il flag è spento:

- l'inserimento resta una spesa normale;
- è disponibile il campo **Rimborso totale** per rimborsi collegati alla singola spesa.


## Modifiche V.49

Riorganizzata la gestione dei rimborsi.

Modifiche principali:

- rimosso il campo **Rimborso totale** dalla normale maschera di inserimento spesa;
- nella sezione **Spese**, ogni voce ha ora il pulsante **Rimborso**;
- cliccando **Rimborso**, l'app apre **Aggiungi spesa** in modalità rimborso generico;
- categoria e descrizione vengono precompilate dalla spesa selezionata;
- l'unico dato da inserire è l'importo del rimborso;
- la data viene impostata automaticamente al giorno corrente ma resta modificabile;
- il rimborso viene sottratto dal budget della categoria della spesa selezionata.

La modifica/eliminazione delle spese resta disponibile solo nella sezione **Spese**, non nella Home.


## Modifiche V.49

Corretto il pulsante **Rimborso** nella sezione **Spese**.

Ora, quando si clicca su **Rimborso** da una spesa esistente:

- l'importo viene precompilato con l'importo della spesa selezionata;
- l'importo resta modificabile;
- la data viene impostata al giorno corrente;
- categoria e descrizione restano precompilate dalla spesa selezionata.


## Modifiche V.49

Migliorata la sezione **Spese**.

- I comandi **Rimborso**, **Modifica** ed **Elimina** sono stati sostituiti con tre icone compatte sulla stessa riga:
  - ↩️ Rimborso;
  - ✏️ Modifica;
  - 🗑️ Elimina.
- Aggiunto il filtro per categoria nella sezione **Spese del mese**.
- Il filtro categoria permette di visualizzare tutte le categorie oppure solo alcune categorie tramite scelta multipla.
- Il filtro viene applicato anche ai rimborsi generici del mese e all'export CSV del mese selezionato.


## Modifiche V.49

Migliorato il filtro **Categorie da visualizzare** nella sezione **Spese**.

- Aggiunto il pulsante **Nessuna** per deselezionare tutte le categorie.
- La sezione è ora a scomparsa/apribile.
- Nel riepilogo della sezione viene mostrato se sono visibili **Tutte**, **Nessuna** oppure quante categorie sono selezionate.


## Correzione V.49

Corretto il pulsante **Nessuna** nel filtro **Categorie da visualizzare**.

Ora il flag viene tolto realmente da tutte le categorie e la lista viene aggiornata mostrando "Nessuna categoria selezionata".


## Correzione V.49

La sezione **Categorie da visualizzare** nella pagina **Spese** viene impostata di default su **Tutte** ogni volta che si apre la sezione Spese.

In questo modo, anche se in precedenza era stato selezionato **Nessuna** o solo alcune categorie, entrando nella sezione Spese il filtro riparte da **Tutte**.


## Modifiche V.49

Migliorata l'usabilità delle icone nella sezione **Spese** su smartphone.

- Icone più grandi.
- Pulsanti più larghi e più alti.
- Maggiore distanza tra le icone.
- Su schermi piccoli le tre icone occupano tutta la larghezza disponibile, così sono più facili da selezionare.


## Modifiche V.49

Aggiunta la possibilità di **modificare** ed **eliminare** i rimborsi.

Nella sezione **Spese**, nella lista **Rimborsi generici del mese**, ogni rimborso ha ora:

- ✏️ Modifica rimborso;
- 🗑️ Elimina rimborso.

La modifica permette di cambiare importo, categoria, data e descrizione.


## Modifiche V.49

Migliorata la sezione **Spese**.

- Aggiunto il pulsante **duplica/ripeti spesa** con icona 🔁.
- Le azioni della singola spesa sono ora dentro un menu a scomparsa.
- Cliccando sul menu azioni vengono visualizzate 4 icone nell'ordine:
  1. ✏️ Modifica
  2. 🔁 Ripeti/Duplica
  3. ↩️ Rimborso
  4. 🗑️ Cancella
- La duplicazione crea una nuova spesa con gli stessi dati e data impostata a oggi.
- Se si duplica una quota plurimensile, viene duplicata come spesa singola.


## Modifiche V.49

Nel menu azioni della sezione **Spese**:

- l'icona ✏️ **Modifica** ha ora sfondo verde;
- l'icona 🔁 **Ripeti/Duplica** ha ora sfondo verde.


## Modifiche V.49

Aggiornata la funzione **Ripeti/Duplica** nella sezione Spese.

- Rimosso lo sfondo verde dalle icone **Modifica** e **Ripeti/Duplica**.
- L'icona **Ripeti/Duplica** è ora bianca con frecce rosse.
- Cliccando **Ripeti/Duplica**, la spesa viene duplicata e aperta subito in modalità modifica.
- La data del duplicato viene impostata automaticamente alla data odierna.


## Modifiche V.49

Corretto il menu azioni nella sezione **Spese** su smartphone.

- Il menu delle icone ora si apre verso sinistra/all'interno della card.
- Le icone non dovrebbero più uscire dallo schermo o spaginare la lista.
- Il pulsante del menu azioni resta allineato a sinistra nella riga della spesa su schermi piccoli.


## Modifiche V.49

Corretto l'allineamento del menu azioni nella sezione **Spese**.

- Il pulsante del menu resta allineato a destra.
- Il pannello con le icone resta ancorato a destra.
- Le icone si sviluppano verso il centro della card, quindi verso sinistra rispetto al pulsante, evitando lo spaginamento laterale.


## Modifiche V.49

Aggiunto nel **Report plurimensile** il filtro **Categorie da visualizzare** con la stessa logica della sezione Spese.

- Sezione a scomparsa.
- Pulsante **Tutte**.
- Pulsante **Nessuna**.
- Selezione multipla delle singole categorie.
- Default su **Tutte** ogni volta che si apre la sezione Report.
- Il filtro modifica grafico, legenda e tabella del report plurimensile.


## Modifiche V.49

Migliorato il filtro periodo nella sezione **Spese**.

- Aggiunta selezione rapida del mese.
- Aggiunti campi **Dal** e **Al** per filtrare un intervallo personalizzato.
- Pulsante **Applica** per applicare il periodo personalizzato.
- Pulsante **Mese corrente** per tornare rapidamente al mese in corso.
- Il filtro periodo viene applicato sia alle spese sia ai rimborsi generici.
- Il filtro categorie lavora insieme al periodo selezionato.
- L'esportazione CSV usa il periodo Dal/Al selezionato.


## Modifiche V.49

Migliorato il filtro periodo nella sezione **Spese**.

- Il menu **Periodo da visualizzare** è ora a scomparsa.
- I campi **Dal** e **Al** sono sulla stessa riga.
- Su smartphone i due campi restano affiancati con dimensioni più compatte.
- Il riepilogo del menu mostra il mese selezionato oppure il periodo personalizzato.


## Modifiche V.49

Aggiunta nella sezione **Spese** la ricerca nella descrizione.

- Nuova sezione a scomparsa **Ricerca nella descrizione**.
- Campo testo per cercare parole presenti nella descrizione.
- Pulsante **Applica**.
- Pulsante **Cancella** per svuotare il campo di ricerca.
- La ricerca lavora insieme al filtro periodo e al filtro categorie.
- La ricerca viene applicata anche ai rimborsi generici.
- L'export CSV rispetta anche la ricerca nella descrizione.


## Modifiche V.49

Aggiunta la gestione delle spese con **metodi di pagamento multipli**.

- Nella maschera **Aggiungi spesa** è possibile inserire più metodi di pagamento con il pulsante **+ Aggiungi metodo**.
- La somma dei metodi deve coincidere con l'importo totale della spesa.
- Una spesa può essere, ad esempio, 45 € totali: 40 € Voucher e 5 € Bancomat.
- La quota **Voucher** viene registrata ma non incide sul budget.
- La lista spese mostra il dettaglio dei metodi di pagamento.
- Modifica, duplica, report e CSV gestiscono la suddivisione dei pagamenti.


## Modifiche V.49

Rifinita la gestione dei metodi di pagamento.

- Con un solo metodo di pagamento, la maschera funziona come nella V.49: un solo campo **Metodo pagamento** e l'importo totale della spesa.
- La gestione avanzata con righe metodo/importo compare solo quando si preme **+ Aggiungi metodo**.
- Dal secondo metodo in poi resta la logica della V.49: la somma dei metodi deve coincidere con l'importo totale.
- La quota **Voucher** continua a essere registrata ma esclusa dal budget.


## Modifiche V.49

Aggiornata la sezione **Spese**.

- Il titolo **Spese del mese** è stato modificato in **Spese**.
- Accanto al titolo viene mostrata la somma in euro delle spese attualmente visualizzate in base ai filtri attivi.
- Il titolo **Rimborsi generici del mese** è stato modificato in **Rimborsi**.
- Accanto al titolo viene mostrata la somma in euro dei rimborsi attualmente visualizzati in base ai filtri attivi.


## Modifiche V.49

Aggiornata l'impaginazione della sezione **Spese**.

- Il totale visualizzato delle **Spese** è ora sulla stessa riga del titolo.
- Il totale visualizzato dei **Rimborsi** è ora sulla stessa riga del titolo.
