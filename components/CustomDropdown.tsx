import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { SelectList } from 'react-native-dropdown-select-list';
import { Dropdown } from 'react-native-element-dropdown';
import { colors } from '../constants';
import AntDesign from '@expo/vector-icons/AntDesign';

interface CustomDropdownProps {
  otherStyles?: any;
  text?: any;
  placeholder: any;
  data: any;
  setSelected: any;
  value?: any;
  boxbg?: any;
  defaultOption?: any;
  enableSearch?: any;
  save?: any;
  autofill?: any;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  otherStyles = '',
  text,
  placeholder,
  data,
  setSelected,
  value,
  boxbg = colors.gray_100,
  defaultOption,
  enableSearch,
  save = 'key',
  autofill = false,
}) => {
  const renderDropdownItem = (item: any) => {
    const isSelected = value === item.value;

    const itemStyle: ViewStyle = {
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomColor: '#fdf6e6',
      borderRadius: 12,
      ...(isSelected && {
        backgroundColor: '#fdf6e6',
      }),
    };

    const textStyle: TextStyle = {
      fontSize: 16,
      fontFamily: 'Poppins-Medium',
      color: colors.gray_400,
      ...(isSelected && {
        color: colors.orange,
        fontWeight: '500',
      }),
    };

    return (
      <View style={itemStyle}>
        <Text style={textStyle}>{item.key}</Text>
        {isSelected && <AntDesign name="check" size={20} color={colors.orange} />}
      </View>
    );
  };

  return (
    <View className={`w-full gap-y-2 ${otherStyles}`}>
      {text && <Text className="font-pmedium text-base text-gray-600">{text}</Text>}
      {autofill ? (
        <Dropdown
          data={data}
          value={value}
          labelField="label"
          valueField="value"
          onChange={(item: any) => setSelected(item.value)}
          placeholder={placeholder}
          search={enableSearch ?? false}
          searchPlaceholder="Search..."
          autoScroll={false}
          renderItem={renderDropdownItem}
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
          itemTextStyle={{
            color: colors.gray_400,
            fontFamily: 'Poppins-Medium',
            fontSize: 16,
          }}
        />
      ) : (
        <SelectList
          search={enableSearch ?? false}
          setSelected={setSelected}
          data={data}
          save={save}
          placeholder={placeholder}
          defaultOption={defaultOption}
          boxStyles={{
            borderRadius: 12,
            backgroundColor: boxbg ?? colors.gray_100,
            borderWidth: 0,
            height: 60,
            alignItems: 'center',
          }}
          inputStyles={{
            color: colors.gray_400,
            fontFamily: 'Poppins-Medium',
            fontSize: 16,
            flex: 1,
            paddingEnd: 4,
          }}
          dropdownStyles={{
            borderRadius: 12,
            backgroundColor: boxbg ?? colors.gray_100,
            borderWidth: 0,
          }}
          dropdownTextStyles={{
            color: colors.gray_400,
            fontFamily: 'Poppins-Medium',
            fontSize: 16,
          }}
          maxHeight={data?.length * 50 < 150 ? data?.length * 50 : 150}
        />
      )}
    </View>
  );
};

export default CustomDropdown;
