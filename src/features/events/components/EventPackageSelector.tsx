// src/features/events/components/EventPackageSelector.tsx
import React from 'react';
import { View } from 'react-native';

import CustomSelectBottomSheet from '@/components/CustomSelectBottomSheet';
import FormField from '@/components/FormField';

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

interface PackageOption {
  key: any;
  value: string;
}

interface EventPackageSelectorProps {
  packages: PackageOption[];
  packageValue: any;
  onPackageChange: (value: any, packageName: string | undefined) => void;
  arrivalValue: any;
  onArrivalChange: (value: any) => void;
  carno: any;
  onCarnoChange: (value: any) => void;
  volunteerValue: any;
  onVolunteerChange: (value: any) => void;
  otherValue: any;
  onOtherChange: (value: any) => void;
  /** Preserves a legacy className quirk on the guest form's "other" field. */
  otherInputStyles?: string;
}

// Presentational package/arrival/car/volunteer/other block, shared by the
// self, guest, and mumukshu registration forms on the Utsav detail screen.
// Holds no store logic — callers own the form state and pass value+onChange.
const EventPackageSelector: React.FC<EventPackageSelectorProps> = ({
  packages,
  packageValue,
  onPackageChange,
  arrivalValue,
  onArrivalChange,
  carno,
  onCarnoChange,
  volunteerValue,
  onVolunteerChange,
  otherValue,
  onOtherChange,
  otherInputStyles = 'font-pmedium text-base',
}) => (
  <View>
    <CustomSelectBottomSheet
      className="mt-7"
      label="Package"
      placeholder="Select Package"
      options={packages}
      selectedValue={packageValue}
      onValueChange={(val: any) =>
        onPackageChange(val, packages.find((item: any) => item.key === val)?.value)
      }
    />

    <CustomSelectBottomSheet
      className="mt-7"
      label="Will you be arriving in your own car?"
      placeholder="Select option"
      options={ARRIVAL}
      selectedValue={arrivalValue}
      onValueChange={(val: any) => onArrivalChange(val)}
    />

    {arrivalValue === 'yes' && (
      <View>
        <FormField
          text="Enter Car Number"
          value={carno}
          handleChangeText={(e: any) => onCarnoChange(e)}
          otherStyles="mt-7"
          inputStyles="font-pmedium text-base"
          containerStyles="bg-gray-100"
          placeholder="XX-XXX-XXXX"
          maxLength={10}
          autoCapitalize="characters"
          autoComplete="off"
        />
      </View>
    )}

    <CustomSelectBottomSheet
      className="mt-7"
      label="Would you like to volunteer?"
      placeholder="Select option"
      options={VOLUNTEER}
      selectedValue={volunteerValue}
      onValueChange={(val: any) => onVolunteerChange(val)}
      saveKeyInsteadOfValue={false}
    />

    <FormField
      text="Any other details?"
      value={otherValue}
      handleChangeText={(e: any) => onOtherChange(e)}
      otherStyles="mt-7 mb-4"
      inputStyles={otherInputStyles}
      containerStyles="bg-gray-100"
      placeholder="Enter details here..."
      multiline
      numberOfLines={3}
    />
  </View>
);

export default EventPackageSelector;
