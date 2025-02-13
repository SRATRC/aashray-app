import { View, Text, TouchableOpacity } from 'react-native';
import { MultipleSelectList } from 'react-native-dropdown-select-list';
import { MultiSelect } from 'react-native-element-dropdown';
import { colors } from '../constants';
import AntDesign from '@expo/vector-icons/AntDesign';

interface CustomMultiSelectDropdownProps {
  otherStyles?: any;
  text?: any;
  placeholder: any;
  data: any;
  value?: any;
  labelField?: any;
  valueField?: any;
  setSelected: any;
  onSelect?: any;
  boxbg?: any;
  enableSearch?: any;
  guest?: any;
}

const CustomMultiSelectDropdown: React.FC<CustomMultiSelectDropdownProps> = ({
  otherStyles,
  text,
  placeholder,
  data,
  value,
  labelField = 'label',
  valueField = 'value',
  setSelected,
  onSelect,
  boxbg = colors.gray_100,
  enableSearch = false,
  guest = false,
}) => {
  return (
    <View className={`gap-y-2 ${otherStyles}`}>
      <Text className="font-pmedium text-base text-gray-600">{text}</Text>
      {guest ? (
        <MultiSelect
          style={{
            minHeight: 60,
            backgroundColor: boxbg,
            borderRadius: 12,
            padding: 16,
          }}
          containerStyle={{
            backgroundColor: 'white',
            borderRadius: 12,
            marginTop: 8,
          }}
          placeholderStyle={{
            fontSize: 16,
            fontFamily: 'Poppins-Medium',
            color: colors.gray_400,
          }}
          selectedTextStyle={{
            fontSize: 16,
            fontFamily: 'Poppins-Medium',
            color: colors.gray_400,
          }}
          inputSearchStyle={{
            height: 45,
            fontSize: 16,
            fontFamily: 'Poppins-Medium',
            borderRadius: 12,
            padding: 16,
          }}
          itemContainerStyle={{
            backgroundColor: boxbg,
          }}
          data={data}
          search={enableSearch}
          maxHeight={300}
          labelField={labelField}
          valueField={valueField}
          placeholder={placeholder}
          searchPlaceholder="Search..."
          value={value}
          onChange={(val) => setSelected(val)}
          renderItem={(item) => {
            const isSelected = value.includes(item.value);
            return (
              <View
                style={[
                  {
                    padding: 16,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottomColor: '#fdf6e6',
                    borderRadius: 12,
                  },
                  isSelected && {
                    backgroundColor: '#fdf6e6',
                  },
                ]}>
                <Text
                  style={[
                    {
                      fontSize: 16,
                      fontFamily: 'Poppins-Regular',
                      color: '#333',
                    },
                    isSelected && {
                      color: colors.orange,
                      fontWeight: '500',
                    },
                  ]}>
                  {item.label}
                </Text>
                {isSelected && <AntDesign name="check" size={20} color={colors.orange} />}
              </View>
            );
          }}
          renderSelectedItem={(item, unSelect) => (
            <TouchableOpacity
              onPress={() => unSelect && unSelect(item)}
              style={{
                flexDirection: 'row',
                backgroundColor: '#fdf6e6',
                borderRadius: 12,
                padding: 8,
                paddingHorizontal: 12,
                marginTop: 8,
                marginRight: 8,
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-Medium',
                  color: colors.orange,
                  marginRight: 6,
                }}>
                {item.label}
              </Text>
              <AntDesign name="close" size={16} color={colors.orange} />
            </TouchableOpacity>
          )}
        />
      ) : (
        <MultipleSelectList
          search={false}
          setSelected={(val: any) => setSelected(val)}
          onSelect={onSelect}
          data={data}
          save="key"
          placeholder={placeholder}
          labelStyles={{
            display: 'none',
          }}
          boxStyles={{
            borderRadius: 12,
            backgroundColor: colors.gray_100,
            borderWidth: 0,
            minHeight: 60,
            alignItems: 'center',
          }}
          inputStyles={{
            color: colors.gray_400,
            fontFamily: 'Poppins-Medium',
          }}
          dropdownStyles={{
            borderRadius: 12,
            backgroundColor: colors.gray_100,
            borderWidth: 0,
          }}
          badgeStyles={{
            backgroundColor: colors.gray_400,
            // color: colors.gray_400,
            // fontFamily: 'Poppins-Medium',
            height: 25,
            alignItems: 'center',
          }}
          dropdownTextStyles={{ color: colors.gray_400 }}
        />
      )}
    </View>
  );
};

export default CustomMultiSelectDropdown;
