const mongoose = require('mongoose');
const { pick, randomInt, chance } = require('../rng');

const CITY_AREAS = [
  { city: 'Cairo', areas: ['Nasr City', 'Maadi', 'Heliopolis', 'Zamalek'] },
  { city: 'Giza', areas: ['Dokki', 'Mohandessin', '6th of October'] },
  { city: 'Alexandria', areas: ['Smouha', 'Sidi Gaber', 'Miami'] },
  { city: 'Qena', areas: ['Qena City', 'Nag Hammadi'] },
  { city: 'Mansoura', areas: ['Toriel', 'City Center'] },
  { city: 'Ismailia', areas: ['Ismailia City'] }
];

const STREETS = ['El Nasr St.', 'Gamal Abdel Nasser St.', 'El Thawra St.', 'Al Nozha St.', 'El Horreya Rd.'];

function generateAddresses(customers) {
  const addresses = [];

  customers.forEach((customer) => {
    const [firstName, ...rest] = customer.fullName.split(' ');
    const lastName = rest.join(' ') || firstName;
    const addressCount = chance(0.3) ? 2 : 1;

    for (let i = 0; i < addressCount; i += 1) {
      const location = pick(CITY_AREAS);
      addresses.push({
        _id: new mongoose.Types.ObjectId(),
        user: customer._id,
        label: i === 0 ? 'Home' : 'Work',
        firstName,
        lastName,
        phone: customer.phone,
        country: 'Egypt',
        city: location.city,
        area: pick(location.areas),
        street: pick(STREETS),
        building: String(randomInt(1, 60)),
        floor: String(randomInt(1, 10)),
        apartment: String(randomInt(1, 20)),
        notes: i === 0 ? undefined : 'Leave with the front desk if not available',
        isDefault: i === 0
      });
    }
  });

  return { addresses };
}

module.exports = { generateAddresses };
