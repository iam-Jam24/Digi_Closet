import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Check, Shirt, Wand2 } from 'lucide-react';
import useOutfits from '../hooks/useOutfits';
import usePlanner from '../hooks/usePlanner';
import { getErrorMessage } from '../services/api';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Select from '../components/Select';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import { OCCASIONS, sortBySlot } from '../constants/wardrobe';
import { addDays, fromISODate, startOfWeek, toISODate, todayISO } from '../utils/dates';
import '../styles/planning.css';

const dayName = new Intl.DateTimeFormat('en-IN', { weekday: 'short' });
const dayNumber = new Intl.DateTimeFormat('en-IN', { day: 'numeric' });
const rangeLabel = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });

function OutfitThumbs({ outfit, max = 3 }) {
  const pieces = sortBySlot(outfit?.clothingItems || []).slice(0, max);
  return (
    <div className="plan-thumbs">
      {pieces.map((item) => (
        <span key={item._id} className="plan-thumbs__item">
          {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <Shirt size={16} strokeWidth={1.25} />}
        </span>
      ))}
    </div>
  );
}

function PlanDialog({ date, plan, outfits, onClose, onSave }) {
  const [outfitId, setOutfitId] = useState(plan?.outfit?._id || '');
  const [occasion, setOccasion] = useState(plan?.occasion || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave(outfitId, occasion);
    setSaving(false);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Plan ${new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(fromISODate(date))}`}
      size="lg"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} loading={saving} disabled={!outfitId}>Save plan</Button>
        </>
      )}
    >
      <div className="plan-dialog">
        <Select label="Occasion (optional)" options={OCCASIONS} value={occasion} onChange={(e) => setOccasion(e.target.value)} placeholder="Any occasion" />
        <p className="field__label">Choose a saved outfit</p>
        <div className="plan-dialog__outfits">
          {outfits.map((outfit) => (
            <button
              key={outfit._id}
              type="button"
              className={`plan-option ${outfitId === outfit._id ? 'plan-option--selected' : ''}`}
              onClick={() => setOutfitId(outfit._id)}
              aria-pressed={outfitId === outfit._id}
            >
              <OutfitThumbs outfit={outfit} max={4} />
              <span className="plan-option__title">{outfit.title}</span>
              {outfit.occasion && <span className="plan-option__meta">{outfit.occasion}</span>}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

export default function OutfitPlanner() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const days = Array.from({ length: 7 }, (_, i) => toISODate(addDays(weekStart, i)));
  const { plans, loading, error, fetchPlans, assign, clear, setWorn } = usePlanner(days[0], days[6]);
  const { saved: outfits, loading: outfitsLoading } = useOutfits();
  const [editing, setEditing] = useState(null);
  const today = todayISO();

  const run = async (action, success, failure) => {
    try {
      await action();
      if (success) showToast(success, 'success');
      return true;
    } catch (err) {
      showToast(getErrorMessage(err, failure), 'error');
      return false;
    }
  };

  const handleSave = async (outfitId, occasion) => {
    const ok = await run(() => assign(editing, outfitId, occasion || null), 'Outfit planned.', 'Could not save this plan.');
    if (ok) setEditing(null);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Planning"
        title="A week, well dressed."
        image="/images/editorial/cream-knit-studio.jpg"
        variant="stacked"
        subtitle="Give each day a look from your saved outfits. Mark days as worn to see what you really reach for in Wardrobe Insights."
      />

      <div className="planner-toolbar">
        <h2 className="planner-toolbar__range">
          {rangeLabel.format(fromISODate(days[0]))} – {rangeLabel.format(fromISODate(days[6]))}
        </h2>
        <div className="planner-toolbar__nav">
          <Button variant="ghost" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week"><ChevronLeft size={16} /></Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>This week</Button>
          <Button variant="ghost" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week"><ChevronRight size={16} /></Button>
        </div>
      </div>

      {error ? (
        <ErrorMessage message={error} onRetry={fetchPlans} />
      ) : (
        <ol className={`week ${loading ? 'week--loading' : ''}`}>
          {days.map((date) => {
            const plan = plans[date];
            const isToday = date === today;
            return (
              <li key={date} className={`day ${isToday ? 'day--today' : ''} ${plan?.worn ? 'day--worn' : ''}`}>
                <header className="day__head">
                  <span className="day__name">{dayName.format(fromISODate(date))}</span>
                  <span className="day__number">{dayNumber.format(fromISODate(date))}</span>
                  {isToday && <span className="day__badge">Today</span>}
                </header>

                {plan?.outfit ? (
                  <div className="day__plan">
                    <OutfitThumbs outfit={plan.outfit} />
                    <p className="day__title">{plan.outfit.title}</p>
                    {plan.occasion && <span className="day__occasion">{plan.occasion}</span>}
                    <div className="day__actions">
                      {date <= today && (
                        <button
                          type="button"
                          className={`day__worn ${plan.worn ? 'day__worn--on' : ''}`}
                          onClick={() => run(() => setWorn(date, !plan.worn), plan.worn ? 'Unmarked.' : 'Marked as worn.', 'Could not update this day.')}
                          aria-pressed={plan.worn}
                        >
                          <Check size={13} /> {plan.worn ? 'Worn' : 'Mark worn'}
                        </button>
                      )}
                      {!plan.worn && <button type="button" className="day__link" onClick={() => setEditing(date)}>Change</button>}
                      <button type="button" className="day__link" onClick={() => run(() => clear(date), 'Plan removed.', 'Could not remove this plan.')}>Remove</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className="day__add" onClick={() => setEditing(date)} disabled={loading || outfitsLoading || outfits.length === 0}>
                    <Plus size={16} strokeWidth={1.5} /> Plan a look
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <section className="section planner-saved">
        <h2 className="section__title">Saved combinations</h2>
        {!outfitsLoading && outfits.length === 0 ? (
          <EmptyState
            icon={Wand2}
            title="No saved outfits yet"
            description="Save outfits from the Outfit Generator, Weather Picks or Fashion Critic to plan them here."
            actionLabel="Generate an outfit"
            onAction={() => navigate('/outfits')}
          />
        ) : (
          <ul className="planner-saved__list">
            {outfits.map((outfit) => (
              <li key={outfit._id}>
                <OutfitThumbs outfit={outfit} max={4} />
                <div>
                  <p className="day__title">{outfit.title}</p>
                  <span className="day__occasion">{[outfit.styleCategory, outfit.occasion].filter(Boolean).join(' · ') || 'Saved outfit'}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        {outfits.length > 0 && <Link to="/saved" className="link-arrow">Manage saved outfits <ChevronRight size={14} /></Link>}
      </section>

      {editing && (
        <PlanDialog
          date={editing}
          plan={plans[editing]}
          outfits={outfits}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
