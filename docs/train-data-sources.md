# Train data sources and limits

RailYatra separates train identity, schedule references and demo booking information:

- **The original sample network** contains 220 directional services assembled from the MIT-licensed [Indian-Railway-Data project](https://github.com/prasenjit-27/Indian-Railway-Data). Its timetable version date is not recorded; routes and schedule fields may be incomplete or stale.
- **Expanded Vande Bharat timetable** was captured as a static reference snapshot on **18 October 2026** from the public [NTES schedule enquiry](https://enquiry.indianrail.gov.in/mntes/) and checked against the Ministry of Railways’ [published Vande Bharat service list](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2288381&lang=1&reg=48). It adds 166 directional schedules, with the classes offered by each train. The July service list includes the older Udaipur–Asarva pair; this snapshot excludes discontinued 26963/26964 and uses the then-current 26903/26904 Surat–Udaipur pair instead. Schedules change, so the snapshot is not a live feed.
- **Lucknow–Katra direct service** includes train 14611, Ghazipur City–Shri Mata Vaishno Devi Katra Express, with a Lucknow stop on its weekly Friday run; 14612 provides the reverse direction. Other dates can use a timed one-change sample itinerary when a connection is available. Train identity can be checked through the [Indian Railways train enquiry](https://www.indianrail.gov.in/enquiry/SCHEDULE/TrainSchedule.html?locale=en).
- **Limited-date special** 02252/02251 New Delhi–Patna Vande Bharat Festival Special is represented only on the listed 18 October snapshot dates, ending **26 November 2026** for the return direction. Exact dates are stored so the app won’t offer that train on other days.
- **Station labels** are combined from the project’s existing station-code reference and the public schedules; cross-check a code with the [Indian Railways station directory](https://indianrailways.gov.in/station_name.pdf).

The data package contains 459 station codes and 388 directional service records. These are curated samples, not every Indian Railways route. A matching train number or service name does not certify every route stop or time. Check the official railway enquiry before planning actual travel. RailYatra is independent and has no live railway or IRCTC connection.

**Simulated fields:** seat availability, class inventory, fares, connections, temporary holds, RAC/waitlist positions, bookings, payments, refunds and train tracking. Downloaded tickets are demo artifacts and are not valid for travel.
