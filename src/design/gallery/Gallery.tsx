// src/design/gallery/Gallery.tsx
// On-device catalog of the Sanctuary design system. Not part of the public
// barrel (`src/design/index.ts`) — import directly for dev tooling/tests:
//   import { Gallery } from '@/src/design/gallery/Gallery';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { icons, IconName } from '../icons/registry';
import { Button, ButtonVariant } from '../components/Button';
import { Field } from '../components/Field';
import { Icon } from '../primitives/Icon';
import { Text } from '../primitives/Text';
import { ThemeProvider, type Theme } from '../theme/ThemeProvider';
import { useTheme } from '../theme/useTheme';
import { spacing, radius, TextVariant } from '../tokens';

const TEXT_VARIANTS: TextVariant[] = [
  'display',
  'title',
  'headline',
  'subtitle',
  'body',
  'bodyStrong',
  'callout',
  'caption',
  'label',
  'button',
];

const BUTTON_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'tertiary', 'destructive'];

const ICON_NAMES = Object.keys(icons) as IconName[];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing[7] }}>
      <Text variant="headline" style={{ marginBottom: spacing[3] }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Swatch({ label, color }: { label: string; color: string }) {
  const t = useTheme();
  return (
    <View style={{ width: 88, marginRight: spacing[3], marginBottom: spacing[3] }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: radius.md,
          backgroundColor: color,
          borderWidth: 1,
          borderColor: t.color.line.default,
        }}
      />
      <Text variant="caption" color="muted" style={{ marginTop: spacing[1] }}>
        {label}
      </Text>
    </View>
  );
}

function ColorGroup({ title, group }: { title: string; group: Record<string, string> }) {
  return (
    <View style={{ marginBottom: spacing[4] }}>
      <Text variant="label" color="muted" style={{ marginBottom: spacing[2] }}>
        {title}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {Object.entries(group).map(([key, value]) => (
          <Swatch key={key} label={key} color={value} />
        ))}
      </View>
    </View>
  );
}

function ColorSwatches() {
  const t = useTheme();
  return (
    <>
      <ColorGroup title="bg" group={t.color.bg} />
      <ColorGroup title="text" group={t.color.text} />
      <ColorGroup title="line" group={t.color.line} />
      <ColorGroup title="accent" group={t.color.accent} />
      <ColorGroup title="status" group={t.color.status} />
    </>
  );
}

function TypeScale() {
  return (
    <View>
      {TEXT_VARIANTS.map((variant) => (
        <View key={variant} style={{ marginBottom: spacing[3] }}>
          <Text variant="caption" color="muted">
            {variant}
          </Text>
          <Text variant={variant}>The quiet mountain retreat</Text>
        </View>
      ))}
    </View>
  );
}

function ButtonMatrix() {
  return (
    <View>
      {BUTTON_VARIANTS.map((variant) => (
        <View key={variant} style={{ marginBottom: spacing[4] }}>
          <Text variant="caption" color="muted" style={{ marginBottom: spacing[2] }}>
            {variant}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <View style={{ marginRight: spacing[2], marginBottom: spacing[2] }}>
              <Button text="Default" variant={variant} onPress={() => {}} />
            </View>
            <View style={{ marginRight: spacing[2], marginBottom: spacing[2] }}>
              <Button text="Disabled" variant={variant} disabled onPress={() => {}} />
            </View>
            <View style={{ marginRight: spacing[2], marginBottom: spacing[2] }}>
              <Button text="Loading" variant={variant} loading onPress={() => {}} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function FieldMatrix() {
  const [defaultValue, setDefaultValue] = useState('');
  const [errorValue, setErrorValue] = useState('taken@example.com');
  const [secureValue, setSecureValue] = useState('');

  return (
    <View>
      <View style={{ marginBottom: spacing[4] }}>
        <Field
          label="Default"
          value={defaultValue}
          onChangeText={setDefaultValue}
          placeholder="Type here"
          helperText="Helper text explains the field"
        />
      </View>
      <View style={{ marginBottom: spacing[4] }}>
        <Field
          label="Error"
          value={errorValue}
          onChangeText={setErrorValue}
          error="This email is already registered"
        />
      </View>
      <View style={{ marginBottom: spacing[4] }}>
        <Field
          label="Secure toggle"
          value={secureValue}
          onChangeText={setSecureValue}
          placeholder="Password"
          secureToggle
        />
      </View>
    </View>
  );
}

function IconSet() {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {ICON_NAMES.map((name) => (
        <View key={name} style={{ width: 76, alignItems: 'center', marginBottom: spacing[3] }}>
          <Icon name={name} />
          <Text variant="caption" color="muted" style={{ marginTop: spacing[1] }}>
            {name}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Catalog({ scheme }: { scheme: Theme['scheme'] }) {
  const t = useTheme();
  return (
    <View style={{ backgroundColor: t.color.bg.canvas, padding: spacing[5] }}>
      <Text variant="title" style={{ marginBottom: spacing[5] }}>
        Sanctuary Gallery — {scheme}
      </Text>
      <Section title="Color tokens">
        <ColorSwatches />
      </Section>
      <Section title="Typography">
        <TypeScale />
      </Section>
      <Section title="Buttons">
        <ButtonMatrix />
      </Section>
      <Section title="Fields">
        <FieldMatrix />
      </Section>
      <Section title="Icons">
        <IconSet />
      </Section>
    </View>
  );
}

export function Gallery() {
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: spacing[10] }}>
      <ThemeProvider forceScheme="light">
        <Catalog scheme="light" />
      </ThemeProvider>
      <ThemeProvider forceScheme="dark">
        <Catalog scheme="dark" />
      </ThemeProvider>
    </ScrollView>
  );
}
