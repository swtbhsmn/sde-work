import React, { useEffect, useState, useMemo } from 'react'
import './App.css'
import CustomTable from './components/Table'
import axios from 'axios'
import ColorModeContext from '../theme'
import { Box, MenuItem, Select, TextField, ThemeProvider, createTheme } from '@mui/material'
import { useMediaQuery } from '@mui/material';
const BASE_URL = "http://localhost:8000"
const TABLE_HEADER = [
    {
        id: 1,
        title: "ID",
        source: "id"
    },
    {
        id: 2,
        title: "Name",
        source: "name"
    },
    {
        id: 3,
        title: "Roll No",
        source: "roll_no"
    },
    {
        id: 4,
        title: "Total Marks",
        source: "total_marks"
    }
]
function App() {
    const [students, setStudents] = useState([]);
    const [totalRecord, setTotalRecord] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(0);
    const [cmp, setCmp] = React.useState('');
    const [marks, setMarks] = React.useState('');

    const handleChange = (event) => {
        axios.get(`${BASE_URL}/students/filter?total_marks=${marks}&cp=${event.target.value}`).then(res => {
                            setStudents(res.data?.data)
                            setCmp(event.target.value)
                        })
    };

    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [themeValue, setThemeValue] = useState(prefersDarkMode ? 'dark' : 'light')
    const colorMode = useMemo(
        () => ({
            toggleColorMode: () => {
                setThemeValue((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
            },
        }),
        []
    );
    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode: themeValue === "dark" ? 'dark' : 'light'
                }
            }),
        [themeValue]
    );

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const response = nextPage === null ? await axios.get(`${BASE_URL}/students`) : await axios.get(`${BASE_URL}${nextPage}`)
            const { data, page, size, next, count } = response.data;
            setStudents(data);
            setNextPage(next)
            setPage(page)
            setSize(size)
            setTotalRecord(count)
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handlePreviousPage = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/students?page=${page - 1}&size=${size}`)
            const { data, page: currentPage, size: currentSize, next, count } = response.data;
            setStudents(data);
            setNextPage(next)
            setPage(currentPage)
            setSize(currentSize)
            setTotalRecord(count)
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    return (
        <React.Fragment>
            <ColorModeContext.Provider value={colorMode}>
                <ThemeProvider theme={theme}>
                    
                    <Box>
                    <TextField type='text' placeholder='Search name' onChange={(e) => {
                        setSearch(e.target.value)
                        axios.get(`${BASE_URL}/students/filter?name=${e.target.value}`).then(res => {
                            setStudents(res.data?.data)
                        })
                    }}  />
                    <TextField  sx={{ml:5}} type='text' placeholder='Enter Marks' onChange={(e) => {
                        setMarks(e.target.value)

                    }} />
                    <Select
                        id="select-cmp"
                        value={cmp}
                        label="<,>,=,!="
                        onChange={handleChange}
                        disabled={marks===""}
                    > 
                        <MenuItem value={"lt"}>Less than</MenuItem>
                        <MenuItem value={"gt"}>Greater than</MenuItem>
                        <MenuItem value={"eq"}>Equal to</MenuItem>
                        <MenuItem value={"neq"}>Not Equal to</MenuItem>
                    </Select>
                    </Box>

                    <CustomTable
                        headerData={TABLE_HEADER}
                        rawData={students}
                        searchText={search}
                        applyFilter={{}}
                        loadNextPage={fetchData}
                        loadPrePage={handlePreviousPage}
                        totalRecord={totalRecord}
                        next={nextPage}
                        size={size}
                        pageno={page}
                    />
                </ThemeProvider>
            </ColorModeContext.Provider>
        </React.Fragment>
    )
}

export default App
