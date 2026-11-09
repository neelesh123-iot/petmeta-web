'use client';

const breeds = [
  {name:'Pomeranian', file:'pomeranian', detail:'Small Spitz-type dog'},
  {name:'Pug', file:'pug', detail:'Compact companion dog'},
  {name:'French Bulldog', file:'french-bulldog', detail:'Small companion dog'},
  {name:'Shiba Inu', file:'shiba-inu', detail:'Medium Spitz-type dog'},
  {name:'German Shepherd', file:'german-shepherd', detail:'Large herding dog'},
  {name:'Mixed-breed dog', file:'mixed-breed', detail:'Exact ancestry is unknown'},
  {name:'Black and tan mixed-breed puppy', file:'black-and-tan-puppy', detail:'Exact ancestry is unknown'},
];

export default function PhotoBreeds({query}:{query:string}) {
  const visible = breeds.filter(pet => `${pet.name} ${pet.detail}`.toLowerCase().includes(query.trim().toLowerCase()));
  if (!visible.length) return null;
  return <section id="photo-breeds" className="photo-breeds" aria-labelledby="photo-breeds-title">
    <div className="shop-section-title"><div><span>YOUR PHOTO BREED GUIDE</span><h2 id="photo-breeds-title">Meet the breeds in your photos</h2></div><small>Visual identification only · Confirm breed and pedigree with the caregiver</small></div>
    <div className="photo-breeds-grid">{visible.map(pet => <article className="photo-breed-card" key={pet.file}>
      <a href={`/pet-breeds/${pet.file}.png`} target="_blank" rel="noreferrer" aria-label={`Open full photo of ${pet.name}`}>
        <img src={`/pet-breeds/${pet.file}.png`} alt={`${pet.name} reference photo`} loading="lazy"/>
      </a>
      <div><h3>{pet.name}</h3><p>{pet.detail}</p><a href={`/pet-breeds/${pet.file}.png`} target="_blank" rel="noreferrer">View full photo ↗</a></div>
    </article>)}</div>
  </section>;
}
