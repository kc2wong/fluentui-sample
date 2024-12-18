import {
  makeStyles,
  Menu,
  MenuList,
  MenuPopover,
  MenuTrigger,
  MenuItemRadio,
  Button,
  MenuItemCheckbox,
  Label,
  Divider,
  Text,
  MenuGroup,
  MenuGroupHeader,
  MenuDivider,
  Caption1,
  Switch,
  Caption1Strong,
} from '@fluentui/react-components';
import {
  BuildingBankRegular,
  GlobeRegular,
  PersonCallRegular,
  PersonRegular,
  PersonSettingsRegular,
  WeatherMoonRegular,
  WeatherSunnyRegular,
} from '@fluentui/react-icons';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Language, UiMode } from '../models/system';
import { Theme } from '../contexts/Theme';
import {  useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { entitledSiteAtom } from '../states/entitledSite';
import { Site } from '../models/site';
import { MessageContext } from '../contexts/Message';
import { useNotification } from '../states/baseState';

const useStyles = makeStyles({
  item: {
    display: 'flex',
    justifyContent: 'flex-start',
    gap: '10px',
  },
  button: {
    justifyContent: 'flex-start',
    width: '110px',
  },
  siteButtonText: {
    display: 'block',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    width: '80px',
  },
  dialogButtonPanel: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: '4px',
    gap: '8px',
  },
  divider: {
    width: '8px',
  },
});

const Spacer: React.FC = () => {
  const styles = useStyles();
  return <Divider className={styles.divider} vertical />;
};

type SiteWithSelection = Site & { selected: boolean };

const EnititledSiteSelectionMenu: React.FC<{ language: Language }> = ({
  language,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [entitledSiteState, action] = useAtom(entitledSiteAtom);
  const [entitledSites, setEntitledSites] = useState<SiteWithSelection[]>([]);
  const messageCtx = useContext(MessageContext);

  useNotification(entitledSiteState, {
    showSpinner: messageCtx.showSpinner,
    stopSpinner: messageCtx.stopSpinner,
    showOperationResultMessage: () => {},
  });

  useEffect(() => {
    if (entitledSiteState.resultSet?.entitledSite === undefined) {
      action({ get: {} });
    } else {
      setEntitledSites(
        entitledSiteState.resultSet.entitledSite.map((item) => {
          return { ...item.site, selected: item.selected };
        })
      );
    }
  }, [action, entitledSiteState.resultSet?.entitledSite]);

  const handleToggleRegionSelection = (region: string, checked: boolean) => {
    const siteOfRegion = entitledSites.filter((item) => item.region === region);
    if (checked) {
      siteOfRegion.forEach((item) => (item.selected = true));
    } else {
      const siteOfOtherRegion = entitledSites
        .filter((item) => item.selected === true)
        .filter((item) => item.region !== region);
      siteOfRegion.forEach((item) => (item.selected = false));
      if (siteOfOtherRegion.length === 0) {
        // no selected site in other regions, mark the first one as selected
        siteOfRegion[0].selected = true;
      }
    }
    setEntitledSites([...entitledSites]);
  };

  const handleToggleSiteSelection = (siteCode: string) => {
    const site = entitledSites.find((item) => item.code === siteCode);
    if (site) {
      if (site.selected) {
        const numOfSelectedSite = entitledSites.filter(
          (item) => item.selected === true
        ).length;
        if (numOfSelectedSite > 1) {
          site.selected = false;
        } else {
          // only one site is selected, do not allow to unselect
          return;
        }
      } else {
        site.selected = true;
      }
      setEntitledSites([...entitledSites]);
    }
  };

  const handleUndoSiteSelection = () => {
    setIsOpen(false);
    const entitledSitesAtom = entitledSiteState.resultSet?.entitledSite;
    if (entitledSitesAtom) {
      setEntitledSites(
        entitledSitesAtom.map((item) => {
          return { ...item.site, selected: item.selected };
        })
      );
    }
  };

  const handleConfirmSiteSelection = () => {
    setIsOpen(false);
    action({
      selectEntitledSite: {
        siteCode: entitledSites
          .filter((item) => item.selected)
          .map((item) => item.code),
      },
    });
  };

  const groupedByRegion = entitledSites
    .sort((s1, s2) => {
      const compareRegion = s1.region.localeCompare(s2.region);
      if (compareRegion === 0) {
        return s1.code.localeCompare(s2.code);
      } else {
        return compareRegion;
      }
    })
    .reduce<Record<string, SiteWithSelection[]>>((acc, item) => {
      const { region } = item;
      if (!acc[region]) {
        acc[region] = [];
      }
      acc[region].push({ ...item, selected: item.selected });
      return acc;
    }, {});

  // List of selected site
  const selectedSiteCode = Object.values(groupedByRegion)
    .flatMap((e) => e)
    .filter((e) => e.selected)
    .map((e) => e.code);

  const siteButtonLabel =
    selectedSiteCode.length === 0 ? '\u2002' : selectedSiteCode.join(',');
  return (
    <div
      style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
    >
      <Label weight="semibold">
        {t('system.message.site')}&nbsp;&nbsp;&nbsp;
      </Label>
      <Menu checkedValues={{ siteCode: selectedSiteCode }} open={isOpen}>
        <MenuTrigger disableButtonEnhancement>
          <Button
            icon={<BuildingBankRegular />}
            onClick={() => setIsOpen(!isOpen)}
          >
            <Text
              className={styles.siteButtonText}
              truncate
            >{`${siteButtonLabel}`}</Text>
          </Button>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            {Object.entries(groupedByRegion).map((e) => {
              return (
                <div key={`group-${e[0]}`}>
                  <MenuGroup>
                    <MenuGroupHeader>
                      <Switch
                        checked={
                          groupedByRegion[e[0]].find(
                            (e) => e.selected === false
                          ) === undefined
                        }
                        label={<Caption1Strong italic>{e[0]}</Caption1Strong>}
                        labelPosition="before"
                        onChange={(_ev, data) =>
                          handleToggleRegionSelection(e[0], data.checked)
                        }
                      />
                    </MenuGroupHeader>
                    {e[1].map((s) => {
                      return (
                        <MenuItemCheckbox
                          key={s.code}
                          name="siteCode"
                          onClick={() => handleToggleSiteSelection(s.code)}
                          value={s.code}
                        >
                          <Caption1>{`${s.code} - ${s.name[language]}`}</Caption1>
                        </MenuItemCheckbox>
                      );
                    })}
                  </MenuGroup>
                  <MenuDivider />
                </div>
              );
            })}
          </MenuList>
          <div className={styles.dialogButtonPanel}>
            <Button onClick={handleUndoSiteSelection} size="small">
              {t('system.message.cancel')}
            </Button>
            <Button
              appearance="primary"
              onClick={handleConfirmSiteSelection}
              size="small"
            >
              {t('system.message.confirm')}
            </Button>
          </div>
        </MenuPopover>
      </Menu>
    </div>
  );
};

interface SystemToolbarProps {
  mode: UiMode;
  onSetMode: (mode: UiMode) => void;
  theme: Theme;
  onSetTheme: (theme: Theme) => void;
  language: Language;
  onSetLanguage: (language: Language) => void;
}

export const SystemToolbar: React.FC<SystemToolbarProps> = ({
  mode,
  onSetMode,
  language,
  onSetLanguage,
  theme,
  onSetTheme,
}) => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleChangeMode = (value: UiMode) => {
    onSetMode(value);
    navigate('/');
  };

  const handleChangeTheme = (value: Theme) => {
    onSetTheme(value);
  };

  const handleChangeLanguage = (value: Language) => {
    onSetLanguage(value);
  };

  const languageEn = t('system.language.value.en');
  const languageZhHant = t('system.language.value.zhHant');
  const themeLight = t('system.theme.value.light');
  const themeDark = t('system.theme.value.dark');
  const modeAdministrator = t('system.mode.value.administrator');
  const modeOperator = t('system.mode.value.operator');

  return (
    <div className={styles.item}>
      {/* show site dropdown for operator mode */}
      {mode === 'operator' ? (
        <>
          <EnititledSiteSelectionMenu language={language} />
          <Spacer />
        </>
      ) : (
        <></>
      )}
      <div
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
      >
        <Label weight="semibold">
          {t('system.mode.label')}&nbsp;&nbsp;&nbsp;
        </Label>
        <Menu checkedValues={{ mode: [mode] }}>
          <MenuTrigger disableButtonEnhancement>
            <Button
              className={styles.button}
              icon={
                mode === 'administrator' ? (
                  <PersonSettingsRegular />
                ) : (
                  <PersonCallRegular />
                )
              }
            >
              <Text>
                {mode === 'administrator' ? modeAdministrator : modeOperator}
              </Text>
            </Button>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItemRadio
                onClick={() => handleChangeMode('administrator')}
                name="mode"
                value="administrator"
              >
                <Label>{modeAdministrator}</Label>
              </MenuItemRadio>
              <MenuItemRadio
                onClick={() => handleChangeMode('operator')}
                name="mode"
                value="operator"
              >
                <Label>{modeOperator}</Label>
              </MenuItemRadio>
            </MenuList>
          </MenuPopover>
        </Menu>
      </div>
      <Spacer />
      <Menu checkedValues={{ lang: [language] }}>
        <MenuTrigger disableButtonEnhancement>
          <Button icon={<GlobeRegular />}></Button>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItemRadio
              onClick={() => handleChangeLanguage(Language.English)}
              name="lang"
              value="en"
            >
              {languageEn}
            </MenuItemRadio>
            <MenuItemRadio
              onClick={() => handleChangeLanguage(Language.TraditionalChinese)}
              name="lang"
              value="zhHant"
            >
              {languageZhHant}
            </MenuItemRadio>
          </MenuList>
        </MenuPopover>
      </Menu>
      <Menu checkedValues={{ theme: [theme] }}>
        <MenuTrigger disableButtonEnhancement>
          <Button
            icon={
              theme === 'light' ? (
                <WeatherSunnyRegular />
              ) : (
                <WeatherMoonRegular />
              )
            }
          ></Button>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItemRadio
              onClick={() => handleChangeTheme('light')}
              name="theme"
              value="light"
            >
              {themeLight}
            </MenuItemRadio>
            <MenuItemRadio
              onClick={() => handleChangeTheme('dark')}
              name="theme"
              value="dark"
            >
              {themeDark}
            </MenuItemRadio>
          </MenuList>
        </MenuPopover>
      </Menu>
    </div>
  );
};
