import type { BossKind, Quest, SpeakerId, Tale, TaleLine } from './types'

export type SpeakerCard = {
  name: string
  role: string
}

const CARDS: Record<SpeakerId, SpeakerCard> = {
  aya: { name: 'Aya', role: 'Gate Aunt' },
  soot: { name: 'Soot', role: 'The Escaped' },
  hoshi: { name: 'Hoshi', role: 'Ink Monk' },
  asa: { name: 'Asa', role: 'Seal-Bearer' },
  kurogane: { name: 'Kurogane', role: 'Gate Warden' },
  futae: { name: 'Futae', role: 'Twin Mask' },
  seijin: { name: 'Seijin', role: 'The Echo' },
}

export function speakerCard(id: SpeakerId): SpeakerCard {
  return CARDS[id]
}

export function emptyQuest(): Quest {
  return {
    act: 'The Porch',
    name: 'A living name',
    objective: 'Speak with Aya, then walk the road.',
  }
}

function actOf(floor: number): { cycle: number; step: 0 | 1 | 2 } {
  const index = Math.max(0, floor - 1)
  const step = (index % 3) as 0 | 1 | 2
  return { cycle: Math.floor(index / 3), step }
}

function tale(id: string, act: string, quest: string, objective: string, lines: TaleLine[]): Tale {
  return { id, act, quest, objective, lines }
}

export function questOf(story: Tale): Quest {
  return { act: story.act, name: story.quest, objective: story.objective }
}

export function arrivalTale(floor: number): Tale {
  const { cycle, step } = actOf(floor)
  const copy = cycle > 0
  if (step === 0) {
    return tale(
      `latch-${floor}`,
      copy ? 'Act I, copied' : 'Act I — The Latch',
      copy ? 'Break the copied latch' : 'Open the Latch',
      'Cross the Gate Court and defeat Kurogane.',
      copy
        ? [
            {
              speaker: 'aya',
              text: 'This is not the latch you already broke. The pagoda copied it, and the copy has read the seals on your scarf.',
            },
            {
              speaker: 'soot',
              text: 'Same uncle. Less patience. He watched you win once, and an order that has been embarrassed gets cruel.',
            },
            {
              speaker: 'asa',
              text: 'Then I walk it again. A copied gate is still a gate.',
            },
          ]
        : [
            {
              speaker: 'aya',
              text: 'Asa. The porch is as far as a living name can wait. Under us the road still has three locks, and your uncle holds the first.',
            },
            {
              speaker: 'soot',
              text: 'Kurogane used to count us home. The regent told him to hold the latch, and the Blank ate every other thought. He cuts anything that moves. Do not argue. He thinks the order is mercy.',
            },
            {
              speaker: 'asa',
              text: 'I still have a name that breathes. I will bring the latch back with it.',
            },
            {
              speaker: 'aya',
              text: 'Walk in. Break the warden. If you fall, I am here. The pagoda does not get the porch.',
            },
          ],
    )
  }
  if (step === 1) {
    return tale(
      `record-${floor}`,
      copy ? 'Act II, copied' : 'Act II — The Record',
      copy ? 'Tear the copied record' : 'Unmask the Record',
      'Reach the gallery and defeat Futae.',
      [
        {
          speaker: 'aya',
          text: copy
            ? 'The archive copied itself around your seals. Futae is writing your route in both faces now.'
            : 'The second lock is the archive. Futae carried every name down this road. Then she split her mask, so one face could remember and one could forget the Blank.',
        },
        {
          speaker: 'hoshi',
          text: 'A seal is a name you borrow, not a prize. When she falls, take one. The road spends names the way a lantern spends oil.',
        },
        {
          speaker: 'aya',
          text: 'The white face lies about mercy. The black face already remembers you. Cut the one that reaches.',
        },
      ],
    )
  }
  return tale(
    `bell-${floor}`,
    copy ? 'Act III, copied' : 'Act III — The Bell',
    copy ? 'Crack the copied bell' : 'Silence the Echo',
    'Climb the saint steps and defeat Seijin.',
    [
      {
        speaker: 'aya',
        text: copy
          ? 'The bell was cast again under your feet. Seijin is the same order, louder, because you made it fail once.'
          : 'Seijin is not a saint. He is the regent’s order, copied into the bell so no one could take it back. Break the echo and the road breathes once.',
      },
      {
        speaker: 'soot',
        text: 'His rings are the bell’s mouth. Stand where the ring is not. It hates the center and the rim alike.',
      },
      {
        speaker: 'hoshi',
        text: 'If the echo dies, the pagoda writes these three floors again, deeper. It has done that to every bearer who lived.',
      },
    ],
  )
}

export function fallTale(floor: number, boss: BossKind): Tale {
  const { cycle } = actOf(floor)
  const again = cycle > 0 ? ' The copy frays, and a new one is already drying underneath.' : ''
  if (boss === 'kurogane') {
    return tale(
      `fall-kurogane-${floor}`,
      'The Latch',
      'A name comes loose',
      'Choose one seal before the road drinks his name.',
      [
        {
          speaker: 'kurogane',
          text: `The order was to hold. I held. Tell Aya the latch is a wound now, not a door.${again}`,
        },
        {
          speaker: 'hoshi',
          text: 'His name is loose. Pick one seal. Leave the rest of him for the ink.',
        },
      ],
    )
  }
  if (boss === 'futae') {
    return tale(
      `fall-futae-${floor}`,
      'The Record',
      'A page unbinds',
      'Choose one seal from the split name.',
      [
        {
          speaker: 'futae',
          text: `You looked at the remembering face. Good. The other one would have made you a page.${again}`,
        },
        {
          speaker: 'hoshi',
          text: 'Two masks, one name. Take a fragment before both faces close.',
        },
      ],
    )
  }
  return tale(
    `fall-seijin-${floor}`,
    'The Bell',
    'One breath',
    'Choose a seal, then walk before the copy finishes your name.',
    [
      {
        speaker: 'seijin',
        text: `The bell stops. It will be cast again below you. That is also the order.${again}`,
      },
      {
        speaker: 'aya',
        text: 'I heard it crack from the porch. That was the breath. Below, the road is writing itself again. Go before it finishes your name.',
      },
      {
        speaker: 'hoshi',
        text: 'Choose. The copy will be hungry.',
      },
    ],
  )
}

export function bossBark(boss: BossKind): { speaker: SpeakerId; text: string } {
  if (boss === 'kurogane') return { speaker: 'kurogane', text: 'The latch stays shut. That was the order.' }
  if (boss === 'futae') return { speaker: 'futae', text: 'Which face did you bring?' }
  return { speaker: 'seijin', text: 'Kneel. The bell has not finished speaking.' }
}

export function deathWords(floor: number): string {
  const { step } = actOf(floor)
  const where = step === 0 ? 'the latch' : step === 1 ? 'the record' : 'the bell'
  return `Aya keeps the porch. The pagoda kept you on ${where}. A living name can try the road again; the seals you carried cannot.`
}
