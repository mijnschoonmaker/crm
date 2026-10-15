# Stem van het CRM

Vaste stem voor alle uitlegvideo's van mijnschoonmaker.com:

- **Stem:** `nl-NL-FennaNeural` (Microsoft neurale stem, Nederlands, vrouw)
- **Toonhoogte:** `-3Hz` (iets lager, minder 'pieperig')
- **Tempo:** `+4%` (natuurlijk spreektempo); vermijd Engelse leenwoorden die de stem uitrekt (bv. "planning" → "plannen"); Engelse namen zoals Google Maps nooit aan het eind van een zin zetten, dan worden ze uitgerekt, hele tekst in één keer ingesproken
- **Nabewerking:** lichte EQ, zachte compressie, geen galm (zie maak.py)
- **Beeld:** opname op 2160x3840 (dsf 5), scherp terugschalen naar 1080x1920
- **Toon:** zakelijk en helder, je-vorm, korte zinnen. Geen "leuk dat je kijkt" of gezellige opvulling; gewoon uitleggen hoe het werkt.
- **Beeld:** geen nep-effecten; alleen echte tikken, zodat de eigen animaties van portaal en CRM te zien zijn

Nieuwe video: zet de tekst en de stappen in `tools/video/tekst.json` en start de workflow **Portaal uitlegvideo** in GitHub Actions. De video komt in de tak `media`.
