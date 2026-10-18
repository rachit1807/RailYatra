# Train data sources and limits

RailYatra separates service identity from timetable and booking information:

- **Train numbers and official listing labels** were matched against the Indian Railways enquiry listing on **18 October 2026**. The enquiry source is the [Indian Railways Passenger Reservation Enquiry](https://www.indianrail.gov.in/enquiry/SCHEDULE/TrainSchedule.html?locale=en). The label displayed in the app is the official listing’s abbreviated name.
- **Readable train names, route stops, running days, scheduled times and route distances** come from a curated snapshot of [Indian-Railway-Data](https://github.com/prasenjit-27/Indian-Railway-Data), whose repository identifies the data as MIT licensed. The dataset does not record a reliable timetable version date. Some route records may be incomplete or stale, and the 220 included services are not an exhaustive list.
- **Station labels** use the station-code reference in the project and should be checked against the [Indian Railways station directory](https://indianrailways.gov.in/station_name.pdf).

The train identity match does not make the timetable live or certify every stop and time. Check the [official railway enquiry](https://www.indianrail.gov.in/enquiry/SCHEDULE/TrainSchedule.html?locale=en) before planning actual travel. RailYatra has no permission or connection to IRCTC or railway booking inventory.

**Simulated fields:** seat availability, class inventory, fares, connections, temporary holds, RAC/waitlist positions, bookings, payments, refunds and train tracking. Downloaded tickets are demo artifacts and are not valid for travel.
