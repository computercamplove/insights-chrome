import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { TextInput, MenuList, MenuItem, Select, SelectVariant, MenuGroup, Checkbox, Bullseye, Spinner } from '@patternfly/react-core';

import './global-filter-menu.scss';
import { useSelector } from 'react-redux';
import { Fragment } from 'react';

export const groupType = {
  checkbox: 'checkbox',
  radio: 'radio',
  button: 'button',
  plain: 'plain',
};

const getMenuItems = (groups, onChange, calculateSelected) => {
  const result = groups.map(({ value, label, id, type, items, ...group }) => ({
    label,
    value,
    items: items.map((item, index) => ({
      ...item,
      key: item.id || item.value || index,
      value: String(item.value || item.id || index),
      onClick: (event) => {
        onChange(
          event,
          calculateSelected(type, value, item.value),
          {
            value,
            label,
            id,
            type,
            items,
            ...group,
          },
          item,
          value,
          item.value
        );
      },
    })),
  }));
  return result.filter(({ noFilter, items = [] }) => noFilter || items.length > 0);
};

const GlobalFilterMenu = (props) => {
  const { filterBy, onFilter, groups = [], onChange, selectedTags } = props;
  const isLoading = useSelector(
    ({ globalFilter }) => !(globalFilter?.sid?.isLoaded && globalFilter?.tags?.isLoaded && globalFilter?.workloads?.isLoaded)
  );
  const isDisabled = useSelector(({ globalFilter }) => globalFilter.globalFilterHidden);
  const [isOpen, setIsOpen] = useState(false);

  const calculateSelected = useCallback(
    (type, groupKey, itemKey) => {
      const activeGroup = selectedTags[groupKey];
      if (activeGroup) {
        if (type !== groupType.radio && (activeGroup[itemKey] instanceof Object ? activeGroup[itemKey].isSelected : Boolean(activeGroup[itemKey]))) {
          return {
            ...selectedTags,
            [groupKey]: {
              ...(activeGroup || {}),
              [itemKey]: false,
            },
          };
        }

        return {
          ...selectedTags,
          [groupKey]: {
            ...(type !== groupType.radio ? activeGroup || {} : {}),
            [itemKey]: true,
          },
        };
      }

      return {
        ...selectedTags,
        [groupKey]: {
          [itemKey]: true,
        },
      };
    },
    [selectedTags]
  );

  const menuItems = getMenuItems(groups, onChange, calculateSelected);
  const menu = [
    <div onClick={(event) => event.stopPropagation()} key="global-filter-menu" className="pf-c-menu ins-c-global-filter__menu">
      {isLoading ? (
        <MenuList>
          <MenuItem>
            <Bullseye>
              <Spinner size="md" />
            </Bullseye>
          </MenuItem>
        </MenuList>
      ) : (
        <Fragment>
          {menuItems.map(({ value, label, items }) => (
            <MenuGroup key={value} label={label} value={value}>
              <MenuList>
                {items.map(({ value, label, onClick, id, tagKey, tagValue }) => {
                  const isChecked =
                    // eslint-disable-next-line react/prop-types
                    !!Object.values(selectedTags).find((tags = {}) => tags[`${tagKey}=${tagValue}`]?.isSelected) ||
                    // eslint-disable-next-line react/prop-types
                    !!Object.values(selectedTags).find((group = {}) => group[tagKey]?.isSelected);
                  return (
                    <MenuItem key={value} onClick={onClick}>
                      <Checkbox className="ins-c-global-filter__checkbox" id={id} isChecked={isChecked} label={label} />
                    </MenuItem>
                  );
                })}
              </MenuList>
            </MenuGroup>
          ))}
          <MenuGroup>
            <MenuList>
              <MenuItem onClick={() => props.setTagModalOpen(true)} isLoadButton>
                Show more
              </MenuItem>
            </MenuList>
          </MenuGroup>
        </Fragment>
      )}
    </div>,
  ];

  return (
    <Select
      isDisabled={isDisabled}
      className={classNames('ins-c-global-filter__select', {
        expanded: isOpen,
      })}
      placeholderText={
        <TextInput
          isDisabled={isDisabled}
          onClick={(event) => {
            if (isOpen) {
              event.stopPropagation();
            }
          }}
          value={filterBy}
          onChange={onFilter}
          placeholder="Filter by status"
          aria-label="Filter by status"
        />
      }
      variant={SelectVariant.typeahead}
      onTypeaheadInputChanged={onFilter}
      onToggle={(isOpen) => {
        setIsOpen(isOpen);
      }}
      isOpen={isOpen}
      hasInlineFilter
      customContent={menu}
    >
      {menu}
    </Select>
  );
};

GlobalFilterMenu.propTypes = {
  filterBy: PropTypes.string,
  onFilter: PropTypes.func.isRequired,
  groups: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.node,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          tagKey: PropTypes.string,
        })
      ),
    })
  ),
  onChange: PropTypes.func.isRequired,
  selectedTags: PropTypes.shape({}),
  setTagModalOpen: PropTypes.func.isRequired,
};

export default GlobalFilterMenu;
