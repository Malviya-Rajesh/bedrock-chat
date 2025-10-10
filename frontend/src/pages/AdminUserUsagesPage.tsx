import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ListPageLayout from '../layouts/ListPageLayout';
import InputText from '../components/InputText';
import Button from '../components/Button';
import { PiArrowDown } from 'react-icons/pi';
import { twMerge } from 'tailwind-merge';
import useUserUsagesForAdmin from '../hooks/useUserUsagesForAdmin';
import { addDate, formatDate, formatDatetime } from '../utils/DateUtils';
import Help from '../components/Help';

const DATA_FORMAT = 'YYYYMMDD';

const AdminUserUsagesPage: React.FC = () => {
  const { t } = useTranslation();

  const [searchDateFrom, setSearchDateFrom] = useState<null | string>(
    formatDate(addDate(new Date(), -1, 'month'), DATA_FORMAT)
  );
  const [searchDateTo, setSearchDateTo] = useState<null | string>(
    formatDate(new Date(), DATA_FORMAT)
  );
  const [isDescCost, setIsDescCost] = useState(true);

  const { userUsages, isLoading } = useUserUsagesForAdmin({
    limit: 100,
    start: searchDateFrom ? searchDateFrom + '00' : undefined,
    end: searchDateTo ? searchDateTo + '23' : undefined,
  });

  const validationErrorMessage = useMemo(() => {
    return !!searchDateFrom === !!searchDateTo
      ? null
      : t('admin.validationError.period');
  }, [searchDateFrom, searchDateTo, t]);

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 5,
        maximumFractionDigits: 5,
      }),
    []
  );

  const normalize = useCallback((value?: number | null) => {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }, []);

  const formatCurrency = useCallback(
    (value?: number | null) => formatter.format(normalize(value)),
    [formatter, normalize]
  );

  const sortedUsages = useMemo(() => {
    if (!userUsages) {
      return undefined;
    }
    const order = isDescCost ? -1 : 1;
    return [...userUsages].sort((a, b) =>
      normalize(a.totalPrice) === normalize(b.totalPrice)
        ? 0
        : normalize(a.totalPrice) > normalize(b.totalPrice)
        ? order
        : order * -1
    );
  }, [isDescCost, normalize, userUsages]);

  return (
    <ListPageLayout
      pageTitle={t('button.userUsages')}
      pageTitleHelp={t('admin.botAnalytics.help.overview')}
      searchCondition={
        <div>
          <div className="rounded border p-2">
            <div className="flex items-center gap-1 text-sm font-bold">
              {t('admin.botAnalytics.label.SearchCondition.title')}
              <Help message={t('admin.botAnalytics.help.calculationPeriod')} />
            </div>

            <div className="flex gap-2 sm:w-full md:w-3/4">
              <InputText
                className="w-full"
                type="date"
                label={t('admin.botAnalytics.label.SearchCondition.from')}
                value={formatDate(searchDateFrom, 'YYYY-MM-DD')}
                onChange={(val) => {
                  if (val === '') {
                    setSearchDateFrom(null);
                    return;
                  }
                  setSearchDateFrom(formatDate(val, DATA_FORMAT));
                }}
                errorMessage={
                  searchDateFrom
                    ? undefined
                    : (validationErrorMessage ?? undefined)
                }
              />
              <InputText
                className="w-full"
                type="date"
                label={t('admin.botAnalytics.label.SearchCondition.to')}
                value={formatDate(searchDateTo, 'YYYY-MM-DD')}
                onChange={(val) => {
                  if (val === '') {
                    setSearchDateTo(null);
                    return;
                  }
                  setSearchDateTo(formatDate(val, DATA_FORMAT));
                }}
                errorMessage={
                  searchDateTo
                    ? undefined
                    : (validationErrorMessage ?? undefined)
                }
              />
            </div>
          </div>
          <div className="mt-2 flex justify-end">
            <Button
              outlined
              rightIcon={
                <PiArrowDown
                  className={twMerge(
                    'transition',
                    isDescCost ? 'rotate-0' : 'rotate-180'
                  )}
                />
              }
              onClick={() => {
                setIsDescCost(!isDescCost);
              }}>
              {t('admin.botAnalytics.label.sortByCost')}
            </Button>
          </div>
        </div>
      }
      isLoading={isLoading}
      isEmpty={sortedUsages?.length === 0}
      emptyMessage={t('admin.userUsages.label.empty', {
        defaultValue: 'No user usage records in this period.',
      })}>
      <div className="flex flex-col gap-3">
        {sortedUsages?.map((usage) => {
          const botEntries = Object.entries(usage.botTotals ?? {}).sort(
            (a, b) => normalize(b[1]) - normalize(a[1])
          );
          return (
            <div
              key={usage.id}
              className="rounded border border-aws-font-color-light/20 p-3 shadow-sm dark:border-aws-font-color-dark/20">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-base font-semibold">{usage.email}</div>
                  <div className="text-xs text-aws-font-color-light/70 dark:text-aws-font-color-dark/70">
                    {usage.id}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {formatCurrency(usage.totalPrice)}
                  </div>
                  {usage.periodTotalPrice !== undefined && (
                    <div className="text-xs">
                      {t('admin.userUsages.label.periodTotal', {
                        defaultValue: 'Selected period total',
                      })}
                      : {formatCurrency(usage.periodTotalPrice)}
                    </div>
                  )}
                  {usage.updatedAt && (
                    <div className="text-xs">
                      {t('admin.userUsages.label.updatedAt', {
                        defaultValue: 'Updated at',
                      })}
                      : {formatDatetime(usage.updatedAt)}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <div className="text-sm font-semibold">
                  {t('admin.userUsages.label.botTotals', {
                    defaultValue: 'Bot usage totals',
                  })}
                </div>
                {botEntries.length === 0 ? (
                  <div className="text-sm text-aws-font-color-light/70 dark:text-aws-font-color-dark/70">
                    {t('admin.userUsages.label.noBotTotals', {
                      defaultValue: 'No bot usage yet.',
                    })}
                  </div>
                ) : (
                  <ul className="flex flex-col gap-1 text-sm">
                    {botEntries.map(([botId, total]) => (
                      <li
                        key={botId}
                        className="flex items-center justify-between gap-2 rounded bg-aws-paper-light/70 px-2 py-1 text-xs dark:bg-aws-paper-dark/70">
                        <span className="truncate" title={botId}>
                          {botId}
                        </span>
                        <span className="whitespace-nowrap font-medium">
                          {formatCurrency(total)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ListPageLayout>
  );
};

export default AdminUserUsagesPage;
