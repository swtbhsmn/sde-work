import React, { useState } from 'react';
import { filter } from 'lodash';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableSortLabel from '@mui/material/TableSortLabel';
import TableRow from '@mui/material/TableRow';
import { Box, Button, Typography } from '@mui/material';


function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
        return -1;
    }
    if (b[orderBy] > a[orderBy]) {
        return 1;
    }
    return 0;
}

function getComparator(order, orderBy) {
    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
}

function applySortFilter(array, comparator, query, appliedFilter) {
    let appliedKey = appliedFilter
    delete appliedKey.searchText

    let filteredData = filter(array, (row) => {
        return Object.keys(appliedKey).every((key) => {
            if (!appliedKey[key]) return true;
            return String(row[key])
                .toLowerCase()
                .includes(appliedKey[key].toLowerCase());
        });
    })

    const stabilizedThis = filteredData.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });
    if (query) {
        return filter(filteredData, (row) => {
            let searchTextLower = query?.trim()?.toLowerCase()
            return Object.values(row).some((value) => {
                if (Array.isArray(value)) {
                    return value.some((element) =>
                        element.toLowerCase().includes(searchTextLower)
                    );
                }
                return String(value).toLowerCase().includes(searchTextLower);
            });
        });
    }
    return stabilizedThis.map((el) => el[0]);
}

export default function CustomTable({
    rawData,
    headerData,
    next,
    pageno,
    size,
    searchText,
    totalRecord,
    applyFilter,loadNextPage,loadPrePage }) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('RuleId');

    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const filteredData = applySortFilter(rawData, getComparator(order, orderBy), searchText, applyFilter);

    return (
        <Box sx={{ width: '100%', height: '100%' }}>
            <TableContainer sx={{ height: (theme) => `calc(100vh - ${theme.mixins.toolbar.minHeight + 120}px)` }}>
                <Table stickyHeader aria-label="sticky table">
                    <TableHead>
                        <TableRow>
                            {headerData?.map((column) => (
                                <TableCell
                                    key={column.id}
                                    sx={{ fontWeight: 700 }}
                                >
                                    <TableSortLabel
                                        active={orderBy === column?.source}
                                        direction={orderBy === column?.source ? order : 'asc'}
                                        onClick={(event) => handleRequestSort(event, column?.source)}
                                    >
                                        {column.title}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    {filteredData?.length > 0 ? (
                        <TableBody>
                            {filteredData
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row, index) => {
                                    return (
                                        <TableRow hover role="checkbox" tabIndex={-1} key={index}>

                                            {headerData.map((column) => {
                                                const value = row[column.source];
                                                return (
                                                    <TableCell key={column.id}>
                                                        {value}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    );
                                })}

                        </TableBody>
                    ) : (
                        <TableBody>
                            <TableRow>
                                <TableCell align="center" colSpan={8} sx={{ py: 3 }}>
                                    <Typography variant="h6" paragraph>
                                        Not found
                                    </Typography>

                                    <Typography variant="body2">
                                        No results found for &nbsp;
                                        {searchText?.trim()?.length > 0 && (<strong>&quot;{searchText?.trim()}&quot;&nbsp;</strong>)}
                                        <strong>
                                            {Object?.keys(applyFilter).map((key) => applyFilter[key])?.filter(_i => _i !== "")?.map((item, key) => {
                                                return (<span key={key}>"{item}"&nbsp;&nbsp;&nbsp;</span>)
                                            })}
                                        </strong>
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    )}
                </Table>
            </TableContainer>
            <Button onClick={loadPrePage} disabled={pageno*size===size}>Pre</Button>
            <Button onClick={loadNextPage} disabled={pageno*size===totalRecord}>Next</Button>
        </Box>
    );
}
