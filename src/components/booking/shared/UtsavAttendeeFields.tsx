import React from 'react';
import { View } from 'react-native';

import FieldGroup from './FieldGroup';

import CustomSelectBottomSheet from '@/src/components/CustomSelectBottomSheet';
import FormField from '@/src/components/FormField';

/**
 * What one attendee of an Utsav has to say: package, arrival and seva.
 *
 * The same three questions apply to the member, to each guest and to each
 * mumukshu, and to both entry points — the catalogue flow and the deep-linked
 * detail screen. They live here so a fourth question lands in one place.
 */

export const ARRIVAL = [
  { key: 'yes', value: 'Yes' },
  { key: 'no', value: 'No' },
];

export const VOLUNTEER = [
  { key: 'admin', value: 'Admin' },
  { key: 'logistics', value: 'Logistics' },
  { key: 'kitchen', value: 'Kitchen' },
  { key: 'vv', value: 'Vitraag Vigyaan Bhavan' },
  { key: 'samadhi', value: 'Samadhi Sthal' },
  { key: 'none', value: 'Unable to Volunteer' },
];

/** A car number is only needed, and only valid, when arriving by car. */
export const attendeeValid = (row: any) =>
  Boolean(row?.package) &&
  Boolean(row?.arrival) &&
  !(row.arrival === ARRIVAL[0].key && (!row.carno || row.carno.length !== 10));

/** The utsav's packages as select options. */
export const packageOptions = (utsav: any) =>
  (utsav?.packages || []).map((p: any) => ({
    key: p.package_id,
    value: `${p.package_name} · ₹${p.package_amount}`,
  }));

interface UtsavAttendeeFieldsProps {
  row: any;
  patch: (field: string, value: any) => void;
  packages: { key: any; value: string }[];
  title?: string;
}

const UtsavAttendeeFields: React.FC<UtsavAttendeeFieldsProps> = ({
  row,
  patch,
  packages,
  title,
}) => (
  <View className="mt-4">
    <FieldGroup title={title}>
      <CustomSelectBottomSheet
        variant="row"
        label="Package"
        placeholder="Choose"
        options={packages}
        selectedValue={row.package}
        onValueChange={(v: any) => {
          patch('package', v);
          patch('package_name', packages.find((p: any) => p.key === v)?.value ?? '');
        }}
      />
      <CustomSelectBottomSheet
        variant="row"
        label="Arriving by car?"
        placeholder="Choose"
        options={ARRIVAL}
        selectedValue={row.arrival}
        onValueChange={(v: any) => {
          patch('arrival', v);
          if (v !== ARRIVAL[0].key) patch('carno', '');
        }}
      />
      <CustomSelectBottomSheet
        variant="row"
        label="Seva preference"
        placeholder="Choose"
        options={VOLUNTEER}
        selectedValue={row.volunteer}
        onValueChange={(v: any) => patch('volunteer', v)}
      />
    </FieldGroup>

    {row.arrival === ARRIVAL[0].key ? (
      <View className="mt-4">
        <FormField
          text="Car number *"
          value={row.carno}
          handleChangeText={(v: string) => patch('carno', v)}
          placeholder="e.g. MH01AB1234"
          maxLength={10}
          autoCapitalize="characters"
        />
      </View>
    ) : null}
  </View>
);

export default UtsavAttendeeFields;
