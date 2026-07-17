# Spese Mensili - PWA locale v16

## Modifiche V.103

Migliorie UI e sostanziali alla sezione Report:

- Nuovi preset rapidi di periodo sempre visibili: "3 mesi", "6 mesi", "12 mesi", "Mese corrente" (un tocco invece di due tendine); il preset attivo è evidenziato.
- Tutti i controlli fini (mese di riferimento, mesi prima/dopo, valore mostrato, vista percentuale) sono ora raccolti nel pannello richiudibile "Periodo e opzioni", con un riepilogo della selezione corrente sempre visibile (es. "apr 2026 – lug 2026 · Budget netto"). Il grafico appare così molto prima, soprattutto su smartphone.
- Nel riepilogo, la card "Periodo" (ridondante) è sostituita da "Vs mese precedente": variazione % e in euro del mese di riferimento rispetto al mese prima, colorata (rosso se in crescita, verde se in calo).
- Il mese di riferimento è ora evidenziato anche nel grafico (banda azzurra dietro la colonna ed etichetta in risalto), coerentemente con la tabella.
- Nuovo pulsante "Esporta CSV" sopra la tabella per scaricare la matrice categorie × mesi (con totali e medie), apribile in Excel.

## Modifiche V.102

Risolto in modo definitivo il problema delle categorie che "sparivano" nel Report:

- La causa: toccare una categoria nella legenda sotto il grafico la nascondeva permanentemente dal report (comportamento introdotto in V.97), e una volta nascosta spariva anche dalla legenda, senza un modo evidente per riattivarla. Nel backup analizzato risultavano infatti già nascoste per errore Caffe, Svago e Pranzo Lavoro.
- La legenda ora mostra sempre tutte le categorie: quelle nascoste restano visibili in grigio barrato e un tocco le riattiva. Nulla sparisce più in modo irreversibile.
- Le categorie nascoste in precedenza per errore riappariranno automaticamente in legenda (barrate), pronte da riattivare con un tocco.

## Modifiche V.101

- Corretto il caso in cui, cliccando una categoria senza spese nel mese, il pannello di dettaglio smetteva di rispondere e le voci sparivano ai click successivi. Ora il recupero dei dati del mese è a prova di errore: il pannello resta sempre visibile e navigabile, anche per categorie vuote o con il grafico in stati particolari.

## Modifiche V.100

Corretto il comportamento del dettaglio nel Report:

- Toccando una voce dell'elenco sotto il grafico, il dettaglio spariva invece di aprirsi. La causa era che il dettaglio ricalcolava i dati a ogni tocco e, se il mese usciva dall'intervallo ricalcolato, otteneva un risultato vuoto e nascondeva il pannello. Ora il dettaglio usa i dati già in memoria e resta stabile.
- Il tocco su grafico, celle della tabella ed elenco spese ora condividono la stessa logica affidabile (navigazione tramite attributi dei dati invece di chiamate inline fragili).
- Toccando una barra o una cella si apre l'elenco delle singole spese; il pulsante "Tutte le categorie" riporta al riepilogo del mese senza far sparire nulla.

## Modifiche V.99

Correzione del tocco sul grafico e ottimizzazione per smartphone:

- Corretto il tap sulle colonne del grafico su smartphone: prima il tocco veniva interpretato come scorrimento e non apriva il dettaglio. Ora un vero tap apre il dettaglio, mentre lo scorrimento orizzontale continua a funzionare.
- Corretta la formula delle coordinate del tocco, che era invertita e sballava il punto rilevato quando il grafico era scalato sullo schermo.
- Il grafico si adatta ora alla larghezza dello schermo: con pochi mesi ci sta tutto senza scorrimento orizzontale; con molti mesi resta scorrevole.
- Su schermi stretti il grafico usa margini, altezza e font ridotti per essere più leggibile.
- Il grafico si ridisegna al cambio di orientamento/dimensione dello schermo.
- Controlli della sezione (selettori, ordinamento tabella) a piena larghezza su mobile; celle della tabella e righe di dettaglio più compatte e con aree di tocco più comode.
- Toccando una colonna, il pannello di dettaglio viene portato in vista automaticamente.

## Modifiche V.98

Ridisegnata completamente la sezione Report, ora in un'unica card (grafico sopra, tabella sotto) invece di quattro card separate:

- Grafico e tabella condividono lo stesso periodo e le stesse categorie selezionate.
- Tocca una pila di categoria (o una cella della tabella) per vedere l'elenco delle singole spese di quella categoria in quel mese; tocca una spesa per aprirla in modifica.
- Nuovo selettore "Valore mostrato": Budget netto / Totale registrato / Voucher.
- Nuova vista percentuale: ogni colonna diventa 100% e mostra la composizione della spesa per capire quali categorie pesano di più.
- Tabella riorganizzata per categoria (una riga per categoria, una colonna per mese) con totale periodo, media e variazione % rispetto alla media (in rosso se in crescita, verde se in calo). Ordinabile per spesa, variazione o nome.
- Nuova proiezione di fine mese per il mese in corso, con avviso se si supererà la soglia totale.
- "Andamento categoria" è confluito nel blocco "Categoria in evidenza" nella stessa card.
- Rimossa CSS morta dalle vecchie card del report.

## Modifiche V.97

Migliorato il grafico del Report plurimensile:

- Palette colori ampliata da 12 a 20 colori: con 13+ categorie selezionate, prima due coppie di categorie finivano con lo stesso colore ed erano indistinguibili nel grafico.
- Rimossa la ripetizione del totale mensile (era scritto sia sotto le barre che sopra il pallino della linea).
- Tocca una colonna del grafico per vedere il dettaglio di spesa per categoria di quel mese.
- La legenda ora è cliccabile: toccare una categoria la nasconde dal grafico, sincronizzato con il filtro categorie sopra.

## Modifiche V.96

Fix urgente: rimosso il campo `"id"` dal manifest, aggiunto in V.90. Su una PWA già installata, cambiare l'id del manifest può rompere il riconoscimento dell'app da parte del browser, bloccando l'aggiornamento sulla schermata di splash. Se l'app resta bloccata sul logo anche dopo questo aggiornamento, va disinstallata e reinstallata una volta (vedi istruzioni di recupero fornite).

## Modifiche V.95

- "Risparmio stimato" in Opportunità di risparmio è ora "Risparmio potenziale (oltre soglia)", calcolato sulle spese reali che superano soglia/obiettivo di categoria, invece che come 20% fisso di quasi ogni spesa (che dipendeva dal valore precompilato "Parzialmente", mai cambiato nel 98% dei casi). La vecchia stima resta visibile, etichettata come "spese marcate come risparmiabili".
- Nuovo promemoria: aprendo "Bilancio familiare", se il mese corrente non ha ancora un'entrata registrata, un avviso propone di aggiungerla (con opzione "Più tardi", una volta al mese).
- Rimossa CSS morta mai usata: `.locked-field-hint`, `.reimbursement-source-banner`, `.family-budget-summary`.

## Modifiche V.94

- Corretto un altro bug di stile: le righe delle entrate nel Bilancio familiare (`.settings-row`) non avevano mai avuto una regola di layout, restando impilate invece che allineate su una riga.
- Condensata la card "Categorie critiche" in Home, con lo stesso stile già applicato al Report per voucher/rimborsi generici.

## Modifiche V.93

Sulla base dell'analisi del backup JSON: Fornitore, Tag e Rimborso generico erano usati in meno del 5% delle spese registrate. Nessun dato o funzionalità è stato rimosso, solo nascosto di default:

- Nel form "Aggiungi spesa" e nel form di modifica, "Fornitore / negozio" e "Tag" sono ora dentro una sezione richiudibile "Fornitore e tag", chiusa di default.
- Il checkbox "Rimborso generico" è ora dentro una sezione richiudibile in cima al form "Aggiungi spesa", invece di essere il primo campo sempre visibile.

## Modifiche V.92

Rivista la sezione "Report" per renderla più leggibile. Nessuna funzionalità rimossa:

- Corretto il riepilogo in cima a "Report per categoria" (Budget utilizzato / Totale registrato / Voucher / Rimborsi generici), che era privo di stile CSS: ora usa le stesse card già presenti nel Report plurimensile e nelle Opportunità di risparmio.
- Corretta anche `.reimbursement-note`, un'altra classe CSS rimasta senza stile.
- Le righe per categoria mostrano ora budget e totale registrato su un'unica riga, con voucher/rimborsi raggruppati in una riga secondaria, invece di 4-5 righe separate.
- "Andamento categoria" è ora una card a sé stante invece di un pannello annidato dentro "Report per categoria".
- Nella tabella del report plurimensile, la colonna "Mese" resta fissa durante lo scroll orizzontale quando sono selezionate molte categorie.

## Modifiche V.91

Riorganizzata la sezione "Soglie e categorie", troppo dispersiva. Nessuna funzionalità rimossa:

- Ogni categoria è ora un pannello a comparsa: la riga mostra solo nome e soglia mensile, mentre ordine, soglia obiettivo, riduzione %, ripartizione predefinita e mesi si aprono al tocco invece di stare sempre visibili.
- Il box "Budget mensile totale" è stato spostato in cima alla sezione come riepilogo.
- Il pannello di una categoria resta aperto dopo aver premuto "Salva" (invece di richiudersi), e si apre automaticamente quando aggiungi una nuova categoria.

## Modifiche V.90

Ottimizzazioni interne, nessuna modifica alle funzionalità visibili:

- Corretto un rischio di perdita dati: se il salvataggio locale risultava illeggibile, l'app ripartiva con un archivio vuoto e lo salvava subito, sovrascrivendo i dati originali. Ora, in questo caso, l'app conserva una copia dei dati non leggibili e mostra un avviso invece di sovrascrivere.
- Il salvataggio dei dati (`saveState`) ora segnala un avviso se fallisce (es. spazio esaurito o modalità privata), invece di interrompersi in silenzio.
- Ridotti i ricalcoli inutili: dopo ogni modifica, l'app aggiorna a fondo solo la sezione attualmente visibile (Home, Spese, Report o Bilancio), invece di ridisegnare sempre anche le sezioni non visibili, incluso il grafico del report plurimensile.
- Sostituita con un ciclo la lunga catena di controlli usata per la migrazione dei salvataggi dalle versioni molto vecchie (v1-v65): stesso comportamento, codice più semplice da mantenere.
- Rimossa una regola CSS duplicata e inutilizzata per i pulsanti a icona (`.icon-button`), senza alcun cambiamento visivo.
- Aggiunti `id`, `lang` e `purpose` delle icone nel manifest della PWA, per un'installazione più corretta su Android/desktop.


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

- La Home mostra chiaramente la versione **V.66**.
- All'apertura e quando si torna alla Home viene visualizzato il mese corrente.
- Nella sezione Aggiungi, la data viene reimpostata automaticamente al giorno corrente.
- Nella sezione Soglie, il budget mensile totale è calcolato automaticamente come somma delle soglie delle categorie.


## Modifiche V.66

- In Home è stato aggiunto un selettore mese.
- La Home si apre sempre sul mese corrente, ma consente di scegliere tutti i mesi in cui è presente almeno una spesa.
- Nella sezione Report è stato aggiunto un report plurimensile.
- Il report plurimensile usa un mese di riferimento e visualizza i 6 mesi precedenti e i 6 mesi successivi.
- Sono presenti pulsanti -6 mesi, mese corrente e +6 mesi.
- Il grafico mostra istogrammi impilati per categoria/soglia e una linea del totale mensile.


## Correzione V.66

Corretto un problema di navigazione dal menu basso: in V.66 lo script poteva interrompersi perché cercava i pulsanti `prevMonthButton` e `nextMonthButton`, rimossi dalla Home. Ora i listener sono protetti e il menu basso cambia correttamente sezione.


## Correzione V.66

Corretto l'errore JavaScript che bloccava l'app:

`document.getElementById("selectedMonthLabel")?.textContent = ...`

L'assegnazione con optional chaining non è valida in JavaScript. Ora il codice verifica prima l'esistenza dell'elemento e poi aggiorna il testo. Questo permette allo script di caricarsi correttamente e al menu basso di funzionare.


## Modifiche V.66

Nel report plurimensile sono state aggiunte due combo box:

- **Mesi precedenti**, valori da 0 a 12;
- **Mesi successivi**, valori da 0 a 12.

Il valore predefinito è 0 per entrambe. Il pulsante "Torna al mese corrente" riporta il mese di riferimento al mese corrente e reimposta entrambe le combo a 0.


## Modifiche V.66

Ottimizzato il grafico plurimensile:

- il primo mese visualizzato parte allineato a sinistra dell'area grafico;
- ridotto lo spazio vuoto iniziale;
- mantenuta la linea del totale mensile centrata sulle barre.


## Modifiche V.66

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


## Modifiche V.66

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


## Modifiche V.66

Migliorata la gestione delle spese plurimensili.

Nella lista spese, per ogni quota plurimensile viene ora visualizzato anche:

- **Importo complessivo** della spesa originaria.

In fase di modifica di una quota plurimensile è ora possibile:

- modificare solo la singola quota;
- applicare categoria, metodo di pagamento e descrizione a tutte le quote collegate;
- modificare l'importo complessivo e ridistribuirlo automaticamente su tutte le quote collegate.

Nota: la data resta specifica della singola quota. Per ripianificare tutte le date conviene eliminare e reinserire la spesa plurimensile.


## Correzione V.66

Versione ricostruita sulla base stabile V.66.

Correzioni principali:

- ripristino corretto della gestione categorie;
- ripristino aggiunta categorie;
- ripristino modifica note/descrizione delle spese;
- mantenute spese plurimensili, importo complessivo e modifica quote collegate;
- mantenuta logica Voucher;
- corretta generazione ID con fallback sicuro;
- aggiunta migrazione da V.66/V.66 senza usare la logica instabile della V.66.


## Correzione V.66

Corretta la regressione della V.66:

- dichiarata correttamente la costante `APP_VERSION`;
- riallineata la chiave di salvataggio a `spese-pwa-locale-v20`;
- mantenuta la base stabile V.66/V.66;
- mantenuta la migrazione dalle versioni precedenti.


## Correzione V.66

Corretta la funzione mancante `renderExpensesMonthSelect()`, che bloccava l'app all'avvio e impediva il caricamento di categorie, spese e funzioni di modifica.


## Correzione V.66

Rimossa completamente la dipendenza dalla funzione `renderExpensesMonthSelect()`.

La logica del filtro mese nella sezione Spese è ora integrata direttamente in `renderExpensesList()`, così l'app non può più bloccarsi all'avvio per quella funzione mancante.


## Modifiche V.66

Nella Home la sintesi del mese è stata resa più chiara:

- **Spese registrate**: totale di tutte le spese inserite, compresi i voucher;
- **Spese escluse i voucher**: totale che incide sul budget;
- **Di cui voucher**: totale delle spese pagate con voucher.


## Modifiche V.66

Nella Home sono ora visualizzate esplicitamente tre righe distinte:

- **Spese registrate**;
- **Spese escluse i voucher**;
- **Di cui voucher**.

Il valore principale della card resta "Spese escluse i voucher", cioè il totale che incide sul budget.


## Modifiche V.66

Nella Home, la sezione **Ultime spese** è ora esplicitamente solo consultiva:

- non mostra il pulsante **Modifica**;
- non mostra il pulsante **Elimina**.

La modifica e l'eliminazione restano disponibili nella sezione **Spese**.


## Modifiche V.66

Aggiunta la gestione dei **rimborsi generici per categoria**.

Esempio: puoi inserire un rimborso di 30 € nella categoria Trasporti anche se non è collegato a una spesa specifica.

Il rimborso generico:

- ha importo, categoria, data e descrizione;
- riduce il budget utilizzato della categoria scelta;
- appare nella sezione **Spese** in una lista separata;
- può essere eliminato;
- viene considerato in Home, Report mensile, Report plurimensile ed export CSV.


## Modifiche V.66

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


## Modifiche V.66

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


## Modifiche V.66

Corretto il pulsante **Rimborso** nella sezione **Spese**.

Ora, quando si clicca su **Rimborso** da una spesa esistente:

- l'importo viene precompilato con l'importo della spesa selezionata;
- l'importo resta modificabile;
- la data viene impostata al giorno corrente;
- categoria e descrizione restano precompilate dalla spesa selezionata.


## Modifiche V.66

Migliorata la sezione **Spese**.

- I comandi **Rimborso**, **Modifica** ed **Elimina** sono stati sostituiti con tre icone compatte sulla stessa riga:
  - ↩️ Rimborso;
  - ✏️ Modifica;
  - 🗑️ Elimina.
- Aggiunto il filtro per categoria nella sezione **Spese del mese**.
- Il filtro categoria permette di visualizzare tutte le categorie oppure solo alcune categorie tramite scelta multipla.
- Il filtro viene applicato anche ai rimborsi generici del mese e all'export CSV del mese selezionato.


## Modifiche V.66

Migliorato il filtro **Categorie da visualizzare** nella sezione **Spese**.

- Aggiunto il pulsante **Nessuna** per deselezionare tutte le categorie.
- La sezione è ora a scomparsa/apribile.
- Nel riepilogo della sezione viene mostrato se sono visibili **Tutte**, **Nessuna** oppure quante categorie sono selezionate.


## Correzione V.66

Corretto il pulsante **Nessuna** nel filtro **Categorie da visualizzare**.

Ora il flag viene tolto realmente da tutte le categorie e la lista viene aggiornata mostrando "Nessuna categoria selezionata".


## Correzione V.66

La sezione **Categorie da visualizzare** nella pagina **Spese** viene impostata di default su **Tutte** ogni volta che si apre la sezione Spese.

In questo modo, anche se in precedenza era stato selezionato **Nessuna** o solo alcune categorie, entrando nella sezione Spese il filtro riparte da **Tutte**.


## Modifiche V.66

Migliorata l'usabilità delle icone nella sezione **Spese** su smartphone.

- Icone più grandi.
- Pulsanti più larghi e più alti.
- Maggiore distanza tra le icone.
- Su schermi piccoli le tre icone occupano tutta la larghezza disponibile, così sono più facili da selezionare.


## Modifiche V.66

Aggiunta la possibilità di **modificare** ed **eliminare** i rimborsi.

Nella sezione **Spese**, nella lista **Rimborsi generici del mese**, ogni rimborso ha ora:

- ✏️ Modifica rimborso;
- 🗑️ Elimina rimborso.

La modifica permette di cambiare importo, categoria, data e descrizione.


## Modifiche V.66

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


## Modifiche V.66

Nel menu azioni della sezione **Spese**:

- l'icona ✏️ **Modifica** ha ora sfondo verde;
- l'icona 🔁 **Ripeti/Duplica** ha ora sfondo verde.


## Modifiche V.66

Aggiornata la funzione **Ripeti/Duplica** nella sezione Spese.

- Rimosso lo sfondo verde dalle icone **Modifica** e **Ripeti/Duplica**.
- L'icona **Ripeti/Duplica** è ora bianca con frecce rosse.
- Cliccando **Ripeti/Duplica**, la spesa viene duplicata e aperta subito in modalità modifica.
- La data del duplicato viene impostata automaticamente alla data odierna.


## Modifiche V.66

Corretto il menu azioni nella sezione **Spese** su smartphone.

- Il menu delle icone ora si apre verso sinistra/all'interno della card.
- Le icone non dovrebbero più uscire dallo schermo o spaginare la lista.
- Il pulsante del menu azioni resta allineato a sinistra nella riga della spesa su schermi piccoli.


## Modifiche V.66

Corretto l'allineamento del menu azioni nella sezione **Spese**.

- Il pulsante del menu resta allineato a destra.
- Il pannello con le icone resta ancorato a destra.
- Le icone si sviluppano verso il centro della card, quindi verso sinistra rispetto al pulsante, evitando lo spaginamento laterale.


## Modifiche V.66

Aggiunto nel **Report plurimensile** il filtro **Categorie da visualizzare** con la stessa logica della sezione Spese.

- Sezione a scomparsa.
- Pulsante **Tutte**.
- Pulsante **Nessuna**.
- Selezione multipla delle singole categorie.
- Default su **Tutte** ogni volta che si apre la sezione Report.
- Il filtro modifica grafico, legenda e tabella del report plurimensile.


## Modifiche V.66

Migliorato il filtro periodo nella sezione **Spese**.

- Aggiunta selezione rapida del mese.
- Aggiunti campi **Dal** e **Al** per filtrare un intervallo personalizzato.
- Pulsante **Applica** per applicare il periodo personalizzato.
- Pulsante **Mese corrente** per tornare rapidamente al mese in corso.
- Il filtro periodo viene applicato sia alle spese sia ai rimborsi generici.
- Il filtro categorie lavora insieme al periodo selezionato.
- L'esportazione CSV usa il periodo Dal/Al selezionato.


## Modifiche V.66

Migliorato il filtro periodo nella sezione **Spese**.

- Il menu **Periodo da visualizzare** è ora a scomparsa.
- I campi **Dal** e **Al** sono sulla stessa riga.
- Su smartphone i due campi restano affiancati con dimensioni più compatte.
- Il riepilogo del menu mostra il mese selezionato oppure il periodo personalizzato.


## Modifiche V.66

Aggiunta nella sezione **Spese** la ricerca nella descrizione.

- Nuova sezione a scomparsa **Ricerca nella descrizione**.
- Campo testo per cercare parole presenti nella descrizione.
- Pulsante **Applica**.
- Pulsante **Cancella** per svuotare il campo di ricerca.
- La ricerca lavora insieme al filtro periodo e al filtro categorie.
- La ricerca viene applicata anche ai rimborsi generici.
- L'export CSV rispetta anche la ricerca nella descrizione.


## Modifiche V.66

Aggiunta la gestione delle spese con **metodi di pagamento multipli**.

- Nella maschera **Aggiungi spesa** è possibile inserire più metodi di pagamento con il pulsante **+ Aggiungi metodo**.
- La somma dei metodi deve coincidere con l'importo totale della spesa.
- Una spesa può essere, ad esempio, 45 € totali: 40 € Voucher e 5 € Bancomat.
- La quota **Voucher** viene registrata ma non incide sul budget.
- La lista spese mostra il dettaglio dei metodi di pagamento.
- Modifica, duplica, report e CSV gestiscono la suddivisione dei pagamenti.


## Modifiche V.66

Rifinita la gestione dei metodi di pagamento.

- Con un solo metodo di pagamento, la maschera funziona come nella V.66: un solo campo **Metodo pagamento** e l'importo totale della spesa.
- La gestione avanzata con righe metodo/importo compare solo quando si preme **+ Aggiungi metodo**.
- Dal secondo metodo in poi resta la logica della V.66: la somma dei metodi deve coincidere con l'importo totale.
- La quota **Voucher** continua a essere registrata ma esclusa dal budget.


## Modifiche V.66

Aggiornata la sezione **Spese**.

- Il titolo **Spese del mese** è stato modificato in **Spese**.
- Accanto al titolo viene mostrata la somma in euro delle spese attualmente visualizzate in base ai filtri attivi.
- Il titolo **Rimborsi generici del mese** è stato modificato in **Rimborsi**.
- Accanto al titolo viene mostrata la somma in euro dei rimborsi attualmente visualizzati in base ai filtri attivi.


## Modifiche V.66

Aggiornata l'impaginazione della sezione **Spese**.

- Il totale visualizzato delle **Spese** è ora sulla stessa riga del titolo.
- Il totale visualizzato dei **Rimborsi** è ora sulla stessa riga del titolo.


## Modifiche V.66

Ottimizzata per smartphone la riga titolo/totale nella sezione **Spese**.

- Il testo del totale è stato accorciato da **Totale visualizzato** a **Totale**.
- Su smartphone titolo e totale restano sulla stessa riga, con titolo a sinistra e totale a destra.
- Il pulsante **CSV** viene disposto sotto, così non comprime la riga del totale.
- Applicata la stessa logica anche al titolo **Rimborsi**.


## Modifiche V.66

Aggiornata la sezione **Spese**.

- Etichetta **Periodo da visualizzare** modificata in **Periodo**.
- Etichetta **Categorie da visualizzare** modificata in **Categorie**.
- Etichetta **Ricerca nella descrizione** modificata in **Descrizione**.
- Il pulsante **CSV** è stato spostato sulla stessa riga, subito dopo il titolo **Spese**.


## Modifiche V.66

Aggiunta la sezione **Bilancio familiare**.

- Nuova voce **Bilancio** nella barra di navigazione.
- Sezione a scomparsa **Entrate** per inserire, modificare ed eliminare le entrate mensili.
- Report tabellare filtrabile per mese di riferimento.
- Il report mostra il mese selezionato e i 12 mesi successivi.
- Per ogni mese vengono mostrati:
  - entrate;
  - spese sottratte per categoria;
  - totale spese;
  - risultato mensile.
- In fondo alla tabella viene mostrato il totale generale del periodo visualizzato.


## Modifiche V.66

Aggiornata la sezione **Bilancio familiare**.

- Il report bilancio ora consente di scegliere quanti mesi visualizzare prima e dopo il mese di riferimento.
- Sono disponibili valori da **0 a 12** per i mesi precedenti e da **0 a 12** per i mesi successivi.
- Il pulsante **Torna al mese corrente** imposta il mese corrente con 0 mesi precedenti e 6 mesi successivi.
- Sistemata la barra di navigazione inferiore per far stare tutte le voci su un'unica riga.


## Modifiche V.66

Aggiornata la sezione **Bilancio familiare**.

- I filtri del **Report bilancio** sono ora in una sezione a scomparsa.
- Il pannello mostra un riepilogo dell'intervallo selezionato: mese di riferimento, mesi precedenti e mesi successivi.


## Modifiche V.66

Aggiornato il report **Bilancio familiare**.

- Le spese per categoria ora includono anche gli importi pagati con **Voucher**.
- Dopo la colonna **Risultato** sono state aggiunte:
  - **Voucher**;
  - **Rimborsi**;
  - **Risultato netto**.
- Il **Risultato** è calcolato come entrate meno spese lorde.
- Il **Risultato netto** è calcolato considerando voucher e rimborsi secondo la logica del budget.


## Modifiche V.66

Aggiornata la sezione **Bilancio familiare**.

- Nel pannello a scomparsa **Entrate**, quando il menu è compattato non viene più mostrato il totale.
- Il pannello mostra solo il titolo **Entrate**.


## Modifiche V.66

Aggiornata la sezione **Bilancio familiare**.

- Rimosso il testo descrittivo sotto i filtri del **Report bilancio**.
- Rimosso il riquadro riepilogativo **Totale periodo** sopra la tabella.
- Il totale generale del periodo resta disponibile nella riga finale della tabella.


## Modifiche V.66

Aggiornato l'ordine delle colonne nel **Report bilancio**.

- Dopo **Entrate** ora vengono mostrate subito:
  - **Risultato**;
  - **Voucher**;
  - **Rimborsi**;
  - **Risultato netto**.
- Dopo queste colonne vengono mostrate le categorie di spesa e il **Totale spese**.


## Modifiche V.66

Aggiornato il **Report bilancio**.

- La colonna **Entrate** è stata spostata dopo **Risultato netto**.
- La colonna **Mese** è stata resa fissa durante lo scorrimento orizzontale della tabella, dove supportato dal browser.


## Modifiche V.66

Aggiornato il **Report bilancio**.

- La colonna **Totale spese** è stata spostata subito dopo **Risultato netto**.
- La colonna **Entrate** viene ora dopo **Totale spese**.
- Le categorie restano dopo le colonne riepilogative.


## Modifiche V.66

Aggiornato il **Report bilancio**.

- La colonna **Risultato** è stata rinominata in **Saldo lordo**.
- La colonna **Risultato netto** è stata rinominata in **Saldo netto**.


## Modifiche V.66

Aggiornata la sezione **Bilancio familiare**.

- Il pulsante **Torna al mese corrente** ora imposta:
  - mese corrente;
  - **0** mesi precedenti;
  - **0** mesi successivi.


## Modifiche V.66

Aggiornata la sezione **Bilancio familiare**.

- Nel filtro del report bilancio è ora possibile selezionare da **0 a 12** mesi precedenti.
- È ora possibile selezionare da **0 a 12** mesi successivi.


## Modifiche V.66

Aggiunto il **backup giornaliero assistito**.

- Alla prima apertura della giornata compare un pop-up per esportare il backup JSON.
- Dopo aver esportato il backup, l'app torna automaticamente alla **Home**.
- Dopo l'esportazione il promemoria non viene più mostrato nella stessa giornata.
- Anche l'esportazione manuale dalla sezione **Backup** aggiorna la data dell'ultimo backup.
- È presente il pulsante **Più tardi** per chiudere temporaneamente l'avviso senza segnare il backup come effettuato.


## Modifiche V.66

Aggiornata la sezione **Aggiungi** e la gestione del backup.

- Il metodo di pagamento predefinito è ora **Bancomat**.
- Nella sezione **Backup** è stato aggiunto il pulsante **Scegli cartella backup**.
- Dove il browser supporta la File System Access API, è possibile scegliere una cartella di backup predefinita.
- I backup JSON successivi vengono salvati in quella cartella, se i permessi sono ancora validi.
- Se il browser non supporta questa funzione, oppure se i permessi non sono disponibili, l'app usa automaticamente il download JSON standard.
- Su molti dispositivi mobili il salvataggio diretto in una cartella predefinita può non essere supportato o può richiedere conferma del permesso.


## Modifiche V.66

Ripristinata la funzione di backup come nella **V.64**.

- Rimossa la scelta della cartella di backup introdotta nella V.65.
- Il backup torna a funzionare con esportazione JSON standard.
- Resta attivo il promemoria giornaliero assistito.
- Dopo il backup giornaliero l'app torna alla **Home** e l'avviso non ricompare nella stessa giornata.
- Rimane confermato **Bancomat** come metodo di pagamento predefinito.
