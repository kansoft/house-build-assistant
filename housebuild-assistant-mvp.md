# HouseBuild Assistant — opis MVP projektu

## Główny problem

Osoby budujące dom często gubią się w kolejności prac, zależnościach między etapami oraz rzeczach, które trzeba przygotować wcześniej. Skutkiem są opóźnienia, dodatkowe koszty, poprawki wykonawcze i stres związany z brakiem pewności, czy dany etap budowy jest gotowy do zamknięcia.

## Najmniejszy zestaw funkcjonalności

- Utworzenie inwestycji budowy domu przez użytkownika
- Wybór aktualnego etapu budowy, np. fundamenty, stan surowy, dach, instalacje, tynki, wylewki
- Wyświetlenie checklisty dla wybranego etapu
- Oznaczanie punktów checklisty jako wykonane / niewykonane
- Przeglądanie, edycja i usuwanie własnych checklist oraz punktów kontrolnych
- Ocena gotowości do przejścia do kolejnego etapu na podstawie zaznaczonych punktów
- Wskazanie braków, ryzyk i rzeczy do sprawdzenia przed zamknięciem etapu
- Prosty system kont użytkowników do przechowywania inwestycji i postępów
- Opcjonalne wsparcie AI do generowania checklisty lub rekomendacji dla aktualnego etapu

## Co NIE wchodzi w zakres MVP

- Pełny harmonogram budowy z kalendarzem ekip
- Zarządzanie budżetem, fakturami i kosztorysem
- OCR faktur, dokumentów lub zdjęć z budowy
- Marketplace wykonawców
- Czat z ekipami budowlanymi
- Integracje z hurtowniami, sklepami lub zewnętrznymi systemami
- Aplikacja mobilna
- Zaawansowany system ról, np. inwestor, kierownik budowy, wykonawca
- Zaawansowane raporty PDF
- Moduł dokumentacji zdjęciowej
- Pełny system smart home lub zarządzania instalacjami

## Logika biznesowa

Aplikacja analizuje aktualny etap budowy i wykonane punkty checklisty, aby określić, czy użytkownik może bezpiecznie przejść do kolejnego etapu oraz jakie braki lub ryzyka powinien jeszcze sprawdzić.

## Przykładowy główny przepływ użytkownika

1. Użytkownik zakłada konto i loguje się do aplikacji.
2. Tworzy inwestycję, np. „Dom jednorodzinny”.
3. Wybiera aktualny etap budowy, np. „Instalacje przed tynkami”.
4. Aplikacja pokazuje checklistę rzeczy do sprawdzenia.
5. Użytkownik oznacza wykonane punkty.
6. System analizuje status checklisty.
7. Aplikacja pokazuje wynik:
   - etap gotowy do zamknięcia,
   - etap częściowo gotowy,
   - etap z ryzykami.
8. Użytkownik widzi rekomendację kolejnego kroku.

## Przykładowe punkty checklisty

### Instalacje przed tynkami

- Sprawdzono rozmieszczenie punktów elektrycznych
- Doprowadzono przewody pod rolety
- Przygotowano przewody pod bramę garażową
- Przygotowano przewody pod domofon / wideodomofon
- Wykonano okablowanie LAN
- Sprawdzono lokalizację rozdzielni elektrycznej
- Uzgodniono przebieg przewodów pod alarm
- Uwzględniono przepusty pod internet i instalacje zewnętrzne
- Zweryfikowano kolizje instalacji elektrycznej z rekuperacją
- Wykonano dokumentację zdjęciową przed tynkami

## Kryteria sukcesu

- Użytkownik może utworzyć inwestycję i zapisać aktualny etap budowy
- Użytkownik może zarządzać checklistą etapu: dodawać, edytować, usuwać i oznaczać punkty
- System potrafi ocenić gotowość etapu na podstawie statusu checklisty
- System potrafi wskazać brakujące lub ryzykowne elementy przed przejściem dalej
- Co najmniej jeden główny przepływ użytkownika jest pokryty testem E2E
- Projekt posiada pipeline CI/CD uruchamiający build i testy
- Aplikacja ma prosty mechanizm logowania i przechowuje dane per użytkownik

## Proponowany test E2E

Test powinien sprawdzić najważniejszy przepływ:

1. Użytkownik loguje się do aplikacji.
2. Tworzy nową inwestycję.
3. Wybiera etap „Instalacje przed tynkami”.
4. Oznacza wybrane punkty checklisty jako wykonane.
5. System pokazuje ocenę gotowości etapu.
6. Po uzupełnieniu wymaganych punktów aplikacja pokazuje, że etap jest gotowy do zamknięcia.

## Proponowany stack

- Frontend: React19 + Astro 6 + TypeScript
- UI: Mantine albo shadcn/ui
- Backend / baza / auth: Supabase
- Stylowanie: Tailwind CSS 4
- Test E2E: Playwright
- CI/CD: GitHub Actions
- Deployment: Cloudflare

## Krótki opis projektu

HouseBuild Assistant to aplikacja webowa pomagająca inwestorowi indywidualnemu prowadzić budowę domu krok po kroku. System udostępnia checklisty dla etapów budowy, pozwala oznaczać wykonane prace i ocenia, czy dany etap jest gotowy do zamknięcia. Aplikacja wskazuje również brakujące elementy i potencjalne ryzyka, aby ograniczyć kosztowne poprawki oraz pomóc użytkownikowi podejmować lepsze decyzje podczas budowy.
