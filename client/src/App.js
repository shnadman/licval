import React from "react";
import ImageUploading from "react-images-uploading";
import { useForm } from "react-hook-form";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import api from "./api";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import makeStyles from "@material-ui/core/styles/makeStyles";
import ImageUpload from "./ImageUpload";
import Box from "@material-ui/core/Box";
import Paper from "@material-ui/core/Paper";
import logo from "./static/logo.png";
import DeleteIcon from "@material-ui/icons/Delete";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

const useStyles = makeStyles((theme) => ({
  root: {
    height: "100vh",
  },
  form: {
    display: "flex",
    width: "20vw",
    height: "60vh",
    justifyContent: "space-around",
    flexDirection: "column",
  },
  buttons: { display: "flex" },

  heading: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightRegular,
  },
  header: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {},
}));

export function App() {
  const { handleSubmit, register } = useForm();
  const [images, setImages] = React.useState([]);
  const [enteredMail, setEnteredMail] = React.useState(false);
  const [deleteSuccess, setDeleteSuccess] = React.useState(null);
  const classes = useStyles();

  const onSubmit = async ({ email }) => {
    let bodyFormData = new FormData();
    const [id, idAttachment, driverLicense, carLicense] = images.map(
      (img) => img["file"]
    );
    bodyFormData.append("email", email);
    bodyFormData.append("id", id);
    bodyFormData.append("idAttachment", idAttachment);
    bodyFormData.append("driverLicense", driverLicense);
    bodyFormData.append("carLicense", carLicense);
    try {
      const res = await api.post("/", bodyFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log(res);
    } catch (e) {
      console.log(e);
    }
  };

  const renderDeleteResponse =
    deleteSuccess !== null ? (
      <Box>
        <Typography>
          {!deleteSuccess ? "פרטים לא נכונים" : "תו חניה בוטל בהצליה"}
        </Typography>
      </Box>
    ) : null;
  const handleDelete = async ({ emailDelete, idDelete }) => {
    try {
      const res = await api.delete(`/cancelParking/${emailDelete}/${idDelete}`);
      setDeleteSuccess(true);
    } catch (e) {
      //If we are here then the email or id didnt match the database!
      setDeleteSuccess(false);
    }
  };

  const renderAccordion = (
    <Paper className={classes.container}>
      <Accordion style={{ marginTop: 50 }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
          style={{ display: "flex", alignItems: "center" }}
        >
          <Typography variant="h5" className={classes.header}>
            ביטול תו חניה
          </Typography>
        </AccordionSummary>
        <AccordionDetails style={{ justifyContent: "center" }}>
          <form onSubmit={handleSubmit(handleDelete)}>
            <div
              style={{
                display: "flex",
                height: 200,
                width: 450,
                justifyContent: "space-between",
                flexDirection: "column",
              }}
            >
              <TextField
                placeholder={"הכנס תעודת זהות"}
                fullWidth
                inputRef={register}
                name={"idDelete"}
              />
              <TextField
                placeholder={"הכנס כתובת מייל"}
                fullWidth
                inputRef={register}
                name={"emailDelete"}
              />
              {renderDeleteResponse}
              <Button
                color="secondary"
                type="submit"
                variant="contained"
                className={classes.button}
                startIcon={<DeleteIcon />}
              >
                שלח בקשה
              </Button>
            </div>
          </form>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );

  return (
    <div>
      <Container maxWidth="md">
        <Paper className={classes.container} elevation={3}>
          <div className={classes.header}>
            <Typography variant="h2">הנפקת תו חניה אוטומטית</Typography>
            <Typography variant="h4">עיריית ראש העין</Typography>
            <img src={logo} height="111px" width="140px" />
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ImageUpload images={images} setImages={setImages} />
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              placeholder={"Ex. avi123@gmail.com"}
              fullWidth
              inputRef={register}
              name={"email"}
              onInput={() => setEnteredMail(true)}
            />
            <Button
              variant={enteredMail ? "contained" : "disabled"}
              color="primary"
              type="submit"
            >
              Submit
            </Button>
          </form>
        </Paper>
        {renderAccordion}
      </Container>
    </div>
  );
}
